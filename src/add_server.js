import 'dotenv/config';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import readline from 'readline';

// Generate secure token (64 chars hex = 32 Bytes)
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Simple async prompt
function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Ask until a non-empty value is provided
async function askRequired(question) {
    let answer = '';
    while (!answer) {
        answer = (await ask(question)).trim();
        if (!answer) {
            console.log("⚠️ This field is required. Please enter a value.");
        }
    }
    return answer;
}

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
        
    // Ask user for values
    const ownerName = await askRequired("Enter server owner's name (required): ");
    const ownerContact = await ask("Enter owner contact info (optional, press Enter to skip): ");
    const serverGuid = await askRequired("Enter server GUID (required, 32/36 chars, can include dashes): ");
    
    const serverGuidSimple = serverGuid.replace(/-/g, "").toLowerCase();

    // Check for existing server guid
    const [rows] = await connection.execute(
        `SELECT * FROM servers WHERE server_guid = ?`,
        [serverGuidSimple]
    );
    if (rows.length > 0) {
        console.log("\n⚠️  Server GUID already exists in DB:");
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
        return;
    }
    
    // Generate secure token
    const token = generateToken();
    
    // Insert row
    const sql = `
        INSERT INTO servers
        SET
            owner_name = ?,
            owner_contact = ?,
            server_guid = ?,
            token = ?
    `;
    const [result] = await connection.execute(
        sql,
        [
            ownerName,
            ownerContact || null,
            serverGuidSimple,
            token
        ]
    );
    
    console.log("\n✅ New authorized server added:");
    console.log({
        id: result.insertId,
        owner_contact: ownerName,
        owner_contact: ownerContact || null,
        server_guid: serverGuidSimple,
        token,
        authorized: true
    });
    
    await connection.end();
}

main().catch(err => {
    console.error("❌ Error:", err);
});
    