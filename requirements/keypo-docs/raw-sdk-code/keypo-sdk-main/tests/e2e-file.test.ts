import fs from 'fs';
import path from 'path';
import { preProcess } from '../src/preProcess';
import { postProcess } from '../src/postProcess';

async function runE2ETest() {
    try {
        // Create a test file with some content
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir);
        }

        const inputFilePath = path.join(testDir, 'input.txt');
        const testContent = 'Hello, this is a test file for end-to-end testing!';

        // Write test file
        fs.writeFileSync(inputFilePath, testContent);

        console.log('Starting end-to-end test...');
        console.log('Input file created at:', inputFilePath);

        // Read the file as a buffer
        const fileBuffer = fs.readFileSync(inputFilePath);
        
        // PreProcess the file
        console.log('\nPreProcessing file...');
        const { dataOut: preProcessedData, metadataOut } = await preProcess(
            fileBuffer,
            'test-file.txt',
            true, // enable debug mode
            { description: 'Test file for end-to-end testing' }
        );

        console.log('PreProcess metadata:', metadataOut);

        // Set output file path based on metadata name
        const outputFilePath = path.join(testDir, metadataOut.name);

        // PostProcess the data
        console.log('\nPostProcessing data...');
        const result = postProcess<Buffer>(preProcessedData, metadataOut, true);

        // Save the result
        if (Buffer.isBuffer(result)) {
            fs.writeFileSync(outputFilePath, result);
        } else {
            throw new Error('Expected result to be a Buffer instance');
        }

        console.log('Output file saved at:', outputFilePath);

        // Verify the result
        const outputContent = fs.readFileSync(outputFilePath, 'utf-8');
        const matches = outputContent === testContent;

        console.log('\nVerification:');
        console.log('Input content:', testContent);
        console.log('Output content:', outputContent);
        console.log('Content matches:', matches ? '✅' : '❌');

        // Cleanup
        fs.unlinkSync(inputFilePath);
        fs.unlinkSync(outputFilePath);
        fs.rmdirSync(testDir);

        console.log('\nTest files cleaned up');
        console.log('End-to-end test completed successfully!');

    } catch (error) {
        console.error('Error during end-to-end test:', error);
        process.exit(1);
    }
}

// Run the test
runE2ETest(); 