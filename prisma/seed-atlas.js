const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb+srv://edusy_admin:admin123@cluster0.cgr1coc.mongodb.net/?appName=Cluster0';



const client = new MongoClient(url);

// Database Name
const dbName = 'edusy';

async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB Atlas');
        const db = client.db(dbName);
        const collection = db.collection('User');

        const users = [
            { email: 'superadmin@edusy.com', name: 'Super Admin', role: 'SUPER_ADMIN', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
            { email: 'admin@edusy.com', name: 'Admin User', role: 'ADMIN', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
            { email: 'accountant@edusy.com', name: 'Accountant User', role: 'ACCOUNTANT', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
            { email: 'teacher@edusy.com', name: 'Teacher User', role: 'TEACHER', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
            { email: 'guardian@edusy.com', name: 'Guardian User', role: 'GUARDIAN', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
            { email: 'student@edusy.com', name: 'Student User', role: 'STUDENT', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
            { email: 'demo@edusy.com', name: 'Demo User', role: 'DEMO', password: 'password123', createdAt: new Date(), updatedAt: new Date() },
        ];

        for (const user of users) {
            const existing = await collection.findOne({ email: user.email });
            if (!existing) {
                const result = await collection.insertOne(user);
                console.log(`Created user ${user.email} with id: ${result.insertedId}`);
            } else {
                console.log(`User ${user.email} already exists.`);
            }
        }

        const count = await collection.countDocuments();
        console.log(`Total users in Atlas DB: ${count}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await client.close();
    }
}

main();
