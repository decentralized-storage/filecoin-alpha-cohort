import { search } from '../src/search';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

async function testSearch() {
    try {
        const address = process.env.CLIENT_ADDRESS;
        if (!address) {
            throw new Error('CLIENT_ADDRESS not found in environment variables');
        }

        console.log('\nTesting search function...');
        console.log('Using address:', address);

        // Test 1: Search for a specific term
        const searchTerm = 'test-data';
        console.log('\nTest 1: Searching for term:', searchTerm);
        const results = await search(searchTerm, address, false);

        // Log results
        console.log('\nSearch Results:');
        console.log('Total matches:', Object.keys(results).length);
        
        // Log details for each match
        Object.entries(results).forEach(([dataId, info]) => {
            console.log('\nMatch found:');
            console.log('Data ID:', dataId);
            console.log('Name:', info.dataMetadata.name);
            console.log('Type:', info.dataMetadata.type);
            console.log('Owner:', info.owner);
        });
    } catch (error) {
        console.error('Error in test:', error);
    }
}

// Run the test
testSearch();
