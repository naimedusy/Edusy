'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (markdown: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export interface RichTextEditorRef {
    focus: () => void;
    execCommand: (command: string, value?: string) => void;
    getMarkdown: () => string;
}

const COLOR_MAP: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f97316',
    purple: '#8b5cf6',
    teal: '#14b8a6',
    amber: '#f59e0b',
    pink: '#ec4899',
    slate: '#64748b',
    black: '#000000',
};

// Reverse map for hex to names
const HEX_TO_NAME: Record<string, string> = Object.entries(COLOR_MAP).reduce((acc, [name, hex]) => {
    acc[hex.toLowerCase()] = name;
    return acc;
}, {} as Record<string, string>);

const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    let html = markdown
        .replace(/\n/g, '<br>')
        .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<u>$1</u>')
        .replace(/~~([^~]+)~~/g, '<strike>$1</strike>')
        .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-size: 0.9em;">$1</code>')
        .replace(/\[color:([^\]]+)\](.*?)\[\/color\]/g, (match, color, content) => {
            const hex = COLOR_MAP[color.toLowerCase()] || color;
            return `<span style="color: ${hex}">${content}</span>`;
        });
    return html;
};

const htmlToMarkdown = (element: HTMLElement): string => {
    let markdown = '';
    
    const traverse = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            markdown += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            
            let prefix = '';
            let suffix = '';
            
            if (tag === 'strong' || tag === 'b') { prefix = '**'; suffix = '**'; }
            else if (tag === 'em' || tag === 'i') { prefix = '*'; suffix = '*'; }
            else if (tag === 'u') { prefix = '__'; suffix = '__'; }
            else if (tag === 'strike' || tag === 's' || tag === 'del') { prefix = '~~'; suffix = '~~'; }
            else if (tag === 'code') { prefix = '`'; suffix = '`'; }
            else if (tag === 'span' || tag === 'font') {
                const color = el.style.color || el.getAttribute('color');
                if (color) {
                    let colorVal = color;
                    if (color.startsWith('rgb')) {
                        const match = color.match(/\d+/g);
                        if (match) {
                            const r = parseInt(match[0]).toString(16).padStart(2, '0');
                            const g = parseInt(match[1]).toString(16).padStart(2, '0');
                            const b = parseInt(match[2]).toString(16).padStart(2, '0');
                            colorVal = `#${r}${g}${b}`;
                        }
                    }
                    const name = HEX_TO_NAME[colorVal.toLowerCase()] || colorVal;
                    prefix = `[color:${name}]`;
                    suffix = `[/color]`;
                }
            } else if (tag === 'br') {
                markdown += '\n';
                return;
            } else if (tag === 'div' || tag === 'p') {
                if (markdown.length > 0 && !markdown.endsWith('\n')) markdown += '\n';
            }

            markdown += prefix;
            el.childNodes.forEach(traverse);
            markdown += suffix;

            if (tag === 'div' || tag === 'p') {
                if (!markdown.endsWith('\n')) markdown += '\n';
            }
        }
    };

    element.childNodes.forEach(traverse);
    return markdown.trim();
};

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
    value,
    onChange,
    onKeyDown,
    placeholder,
    className = '',
    minHeight = '3.25rem'
}, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const initialRender = useRef(true);

    // Sync from props
    useEffect(() => {
        if (!editorRef.current) return;
        
        const currentMarkdown = htmlToMarkdown(editorRef.current);
        // Only update innerHTML if it's externally changed and different from current content
        if (value !== currentMarkdown) {
            editorRef.current.innerHTML = markdownToHtml(value);
        }
    }, [value]);

    useImperativeHandle(ref, () => ({
        focus: () => {
            editorRef.current?.focus();
            document.execCommand('styleWithCSS', false, 'true');
        },
        execCommand: (command: string, arg?: string) => {
            if (!editorRef.current) return;
            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand(command, false, arg);
            // Trigger change manually as execCommand doesn't always trigger input
            const md = htmlToMarkdown(editorRef.current);
            onChange(md);
        },
        getMarkdown: () => {
            if (!editorRef.current) return '';
            return htmlToMarkdown(editorRef.current);
        }
    }));

    const handleInput = () => {
        if (!editorRef.current) return;
        const md = htmlToMarkdown(editorRef.current);
        onChange(md);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        
        // Check if pasted text contains our markdown tags. 
        // If so, we want to render them immediately.
        if (text.includes('[color:') || text.includes('**') || text.includes('__') || text.includes('~~') || text.includes('`')) {
            const html = markdownToHtml(text);
            document.execCommand('insertHTML', false, html);
        } else {
            document.execCommand('insertText', false, text);
        }
        handleInput();
    };

    return (
        <div className="relative w-full">
            {!value && placeholder && (
                <div className="absolute inset-0 px-5 py-4 text-slate-400 font-semibold pointer-events-none select-none text-sm leading-relaxed">
                    {placeholder}
                </div>
            )}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={onKeyDown}
                onPaste={handlePaste}
                className={`w-full outline-none text-sm font-bold leading-relaxed text-slate-800 break-words whitespace-pre-wrap ${className}`}
                style={{ minHeight, padding: '1rem 1.25rem' }}
            />
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
