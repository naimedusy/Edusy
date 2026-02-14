import { MongoClient } from 'mongodb';

// Connection URL
const url = 'mongodb+srv://mdnaimuuddine_db_user:xDAJ3_A4Yb$ugN@cluster0.cgr1coc.mongodb.net/';

const client = new MongoClient(url);

// Database Name
const dbName = 'edusy';

async function main() {
    try {
        // Use connect method to connect to the server
        await client.connect();
        console.log('Connected successfully to server');
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

        // Verify
        const count = await collection.countDocuments();
        console.log(`Total users in DB: ${count}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await client.close();
    }
}

main();
