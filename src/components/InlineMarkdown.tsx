'use client';

import React from 'react';

/**
 * Lightweight inline markdown renderer — no dependencies.
 * Supports: **bold**, *italic*, __underline__, ~~strikethrough~~,
 * `code`, [color:red]text[/color], and newlines.
 */

type Segment =
    | { type: 'text'; value: string }
    | { type: 'bold'; children: Segment[] }
    | { type: 'italic'; children: Segment[] }
    | { type: 'underline'; children: Segment[] }
    | { type: 'strike'; children: Segment[] }
    | { type: 'code'; value: string }
    | { type: 'color'; color: string; children: Segment[] }
    | { type: 'br' };

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

function parse(text: string): Segment[] {
    if (!text) return [];
    
    // First, handle color tags specifically since they are complex
    const colorRegex = /\[color:([^\]]+)\]([\s\S]*?)\[\/color\]/g;
    let lastIndex = 0;
    const segments: Segment[] = [];
    let match;

    while ((match = colorRegex.exec(text)) !== null) {
        // Text before the color tag
        if (match.index > lastIndex) {
            segments.push(...parseMarkdownOnly(text.slice(lastIndex, match.index)));
        }

        const colorName = match[1].trim().toLowerCase();
        const innerText = match[2];
        const hexColor = COLOR_MAP[colorName] || colorName;
        
        segments.push({ 
            type: 'color', 
            color: hexColor, 
            children: parse(innerText) 
        });

        lastIndex = colorRegex.lastIndex;
    }

    // Text after the last color tag
    if (lastIndex < text.length) {
        segments.push(...parseMarkdownOnly(text.slice(lastIndex)));
    }

    return segments;
}

function parseMarkdownOnly(text: string): Segment[] {
    if (!text) return [];
    const segments: Segment[] = [];
    let i = 0;
    const len = text.length;

    const peek = (pattern: string) => text.startsWith(pattern, i);

    while (i < len) {
        if (text[i] === '\n') {
            segments.push({ type: 'br' });
            i++;
            continue;
        }

        if (peek('**')) {
            const end = text.indexOf('**', i + 2);
            if (end !== -1) {
                segments.push({ type: 'bold', children: parseMarkdownOnly(text.slice(i + 2, end)) });
                i = end + 2;
                continue;
            }
        }

        if (peek('__')) {
            const end = text.indexOf('__', i + 2);
            if (end !== -1) {
                segments.push({ type: 'underline', children: parseMarkdownOnly(text.slice(i + 2, end)) });
                i = end + 2;
                continue;
            }
        }

        if (peek('~~')) {
            const end = text.indexOf('~~', i + 2);
            if (end !== -1) {
                segments.push({ type: 'strike', children: parseMarkdownOnly(text.slice(i + 2, end)) });
                i = end + 2;
                continue;
            }
        }

        if (peek('*')) {
            const end = text.indexOf('*', i + 1);
            if (end !== -1) {
                segments.push({ type: 'italic', children: parseMarkdownOnly(text.slice(i + 1, end)) });
                i = end + 1;
                continue;
            }
        }

        if (peek('`')) {
            const end = text.indexOf('`', i + 1);
            if (end !== -1) {
                segments.push({ type: 'code', value: text.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }

        let next = len;
        for (const marker of ['**', '__', '~~', '*', '`', '\n']) {
            const idx = text.indexOf(marker, i);
            if (idx !== -1 && idx < next) next = idx;
        }
        segments.push({ type: 'text', value: text.slice(i, next) });
        i = next;
    }

    return segments;
}

function renderSegments(segments: Segment[], keyPrefix = ''): React.ReactNode[] {
    return segments.map((seg, idx) => {
        const key = `${keyPrefix}-${idx}`;
        switch (seg.type) {
            case 'br':    return <br key={key} />;
            case 'text':  return <React.Fragment key={key}>{seg.value}</React.Fragment>;
            case 'code':  return <code key={key} className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[0.85em]">{seg.value}</code>;
            case 'bold':  return <strong key={key} className="font-black">{renderSegments(seg.children, key)}</strong>;
            case 'italic':return <em key={key} className="italic">{renderSegments(seg.children, key)}</em>;
            case 'underline': return <u key={key}>{renderSegments(seg.children, key)}</u>;
            case 'strike':return <s key={key} className="line-through opacity-60">{renderSegments(seg.children, key)}</s>;
            case 'color': return <span key={key} style={{ color: seg.color }}>{renderSegments(seg.children, key)}</span>;
            default:      return null;
        }
    });
}

interface InlineMarkdownProps {
    text: string;
    className?: string;
    debug?: boolean;
}

export default function InlineMarkdown({ text, className = '' }: InlineMarkdownProps) {
    const segments = parse(text);
    return (
        <span className={className}>
            {renderSegments(segments)}
        </span>
    );
}
