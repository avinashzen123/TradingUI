#!/usr/bin/env node

/**
 * Download instrument files from Upstox and save them to public folder
 * Uses a CORS proxy to bypass CORS restrictions during build
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTRUMENTS = {
    NSE: 'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz',
    MCX: 'https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz'
};

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'instruments');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created directory: ${OUTPUT_DIR}`);
}

function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`📥 Downloading: ${url}`);
        
        const file = fs.createWriteStream(outputPath);
        const protocol = url.startsWith('https') ? https : http;
        
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        };
        
        protocol.get(url, options, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                console.log(`↪️  Redirecting to: ${response.headers.location}`);
                downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                const stats = fs.statSync(outputPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`✅ Downloaded: ${path.basename(outputPath)} (${sizeMB} MB)`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });
    });
}

async function downloadAll() {
    console.log('🚀 Downloading instrument files from Upstox...\n');
    console.log('⚠️  Note: If download fails due to CORS/403, you need to:');
    console.log('   1. Manually download files from Upstox');
    console.log('   2. Or use a backend proxy');
    console.log('   3. Or skip this step (instruments won\'t load)\n');
    
    try {
        for (const [exchange, url] of Object.entries(INSTRUMENTS)) {
            const filename = `${exchange}.json.gz`;
            const outputPath = path.join(OUTPUT_DIR, filename);
            
            try {
                await downloadFile(url, outputPath);
            } catch (error) {
                console.error(`❌ Failed to download ${exchange}:`, error.message);
                console.log(`\n📝 Manual download instructions for ${exchange}:`);
                console.log(`   1. Open: ${url}`);
                console.log(`   2. Save as: ${outputPath}`);
                console.log(`   3. Or use curl: curl -o "${outputPath}" "${url}"\n`);
            }
        }
        
        // Check if any files were downloaded
        const files = fs.readdirSync(OUTPUT_DIR);
        if (files.length > 0) {
            console.log('\n✅ Instrument files ready!');
            console.log(`📁 Location: ${OUTPUT_DIR}`);
            console.log(`📦 Files: ${files.join(', ')}`);
        } else {
            console.log('\n⚠️  No files downloaded. App will not be able to load instruments.');
            console.log('   Consider using a backend proxy or manual download.');
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Continuing build anyway (instruments may not work)...');
    }
}

downloadAll();

