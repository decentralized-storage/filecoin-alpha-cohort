import { getDataInfo } from "../src/getDataInfo";
import * as dotenv from "dotenv";

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

async function testGetDataInfo() {
    try {
        const DATA_IDENTIFIER = process.env.DATA_IDENTIFIER;
        if (!DATA_IDENTIFIER) {
            throw new Error("DATA_IDENTIFIER not found in .env.development");
        }

        

        // Call share function with debug mode
        const dataInfo = await getDataInfo(
            DATA_IDENTIFIER,
            true,
            'http://localhost:3000'
        );
        console.log("Data Info:", dataInfo);
        console.log("Get Data Info completed successfully");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Run the test
testGetDataInfo();
