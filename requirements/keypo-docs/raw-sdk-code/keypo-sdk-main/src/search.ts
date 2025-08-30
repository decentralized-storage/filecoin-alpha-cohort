import { list } from './list';

export async function search(
    searchTerm: string,
    address: string,
    debug?: boolean
) {
    if (debug) {
        console.log("[DEBUG] Searching for term:", searchTerm);
        console.log("[DEBUG] In address:", address);
    }

    // Get all accessible files
    const allFiles = await list(address, debug);

    if (debug) {
        console.log("[DEBUG] Total files found:", Object.keys(allFiles).length);
    }

    // Filter files based on search term
    const matchingFiles: { [key: string]: any } = {};
    const searchTermLower = searchTerm.toLowerCase();

    for (const [dataIdentifier, fileInfo] of Object.entries(allFiles)) {
        const fileName = fileInfo.dataMetadata.name?.toLowerCase() || '';
        if (fileName.includes(searchTermLower)) {
            matchingFiles[dataIdentifier] = fileInfo;
        }
    }

    if (debug) {
        console.log("[DEBUG] Matching files found:", Object.keys(matchingFiles).length);
        console.log("[DEBUG] Matching files:", matchingFiles);
    }

    return matchingFiles;
} 