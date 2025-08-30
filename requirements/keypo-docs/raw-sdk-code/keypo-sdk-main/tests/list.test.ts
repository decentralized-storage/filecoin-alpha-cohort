import { list } from "../src/list.ts";
import * as dotenv from "dotenv";

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

async function testList() {
    try {
        const TEST_ADDRESS = process.env.CLIENT_ADDRESS;
        if (!TEST_ADDRESS) {
            throw new Error("CLIENT_ADDRESS not found in .env.development");
        }

        console.log("Test address:", TEST_ADDRESS);

        // Call list function with debug mode, filter for files containing 'te', sort by cid, and use pagination
        const result = await list(TEST_ADDRESS, true, 'http://localhost:3000', {
            filterBy: {
                field: 'name',
                value: 'te',
                operator: 'contains'
            },
            sortBy: {
                field: 'cid',
                direction: 'desc'
            },
            pagination: {
                pageSize: 10,  // Fetch 10 items per page
                maxPages: 1    // Limit to 1 page maximum
            }
        });
        
        console.log("List result (filtered, sorted, and paginated):", result);

        // Log some basic stats
        console.log("Total files found:", Object.keys(result).length);
        
        // Verify sorting
        const fileNames = Object.values(result).map(file => file.dataMetadata.name);
        console.log("File names in order:", fileNames);
        
        // Check if names are sorted
        const isSorted = fileNames.every((name, i) => 
            i === 0 || name >= fileNames[i - 1]
        );
        console.log("Files are sorted by name:", isSorted);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Run the test
testList(); 