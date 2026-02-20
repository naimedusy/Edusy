import fs from 'fs';

const filePath = 'f:/Edusy User flow/Edusy app/prisma/schema.prisma';
let content = fs.readFileSync(filePath, 'utf8');

const updateModel = (modelName) => {
    const regex = new RegExp(`model ${modelName} {([\\s\\S]*?)}`, 'g');
    content = content.replace(regex, (match, body) => {
        if (body.includes('assignments Assignment[]')) {
            return match;
        }
        // Insert before the last closing brace
        return `model ${modelName} {${body}\n  assignments Assignment[]\n}`;
    });
};

updateModel('Institute');
updateModel('Class');
updateModel('Group');
updateModel('Book');

fs.writeFileSync(filePath, content);
console.log('Schema updated successfully');
