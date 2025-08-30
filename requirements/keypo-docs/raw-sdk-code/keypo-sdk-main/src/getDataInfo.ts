export async function getDataInfo(
    dataIdentifier: string,
    debug?: boolean,
    apiUrl?: string
) {
    
    // If localURL is provided, use it, otherwise use the default
    const baseUrl = apiUrl || 'https://api.keypo.io';
    
    // First check if the file is deleted
    const isDeletedUrl = `${baseUrl}/graph/isDeleted?fileIdentifier=${dataIdentifier}`;
    
    if (debug) {
        console.log("[DEBUG] Checking if file is deleted at:", isDeletedUrl);
    }

    const isDeletedResponse = await fetch(isDeletedUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const isDeletedData = await isDeletedResponse.json();
    
    if (debug) {
        console.log("[DEBUG] Is deleted response:", isDeletedData);
    }

    if (!isDeletedResponse.ok) {
        throw new Error(`IsDeleted API request failed with status ${isDeletedResponse.status}: ${await isDeletedResponse.text()}`);
    }

    // If file is deleted, return null
    if (isDeletedData.isDeleted) {
        if (debug) {
            console.log("[DEBUG] File is deleted, returning null");
        }
        return null;
    }

    // If not deleted, proceed with getting metadata
    const metadataUrl = `${baseUrl}/graph/fileMetadata?fileIdentifier=${dataIdentifier}`;

    if (debug) {
        console.log("[DEBUG] Calling metadata API at:", metadataUrl);
    }

    const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    if (debug) {
        console.log("[DEBUG] Got metadata from API:", data);
    }
    
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    // If there's no metadata for some reason, return null
    if (!data.fileMetadata) {
        if (debug) {
            console.log("[DEBUG] No fileMetadata found, returning null");
        }
        return null;
    }

    // Parse the nested fileMetadata string
    const fileMetadata = JSON.parse(data.fileMetadata.fileMetadata);

    const fileContractAddress = data.fileMetadata.fileContractAddress;
    const minters: any[] = [];
    const pageSize = 100;
    let hasMore = true;
    let skip = 0;

    while (hasMore) {
        try {
          const response = await fetch(`${apiUrl}/graph/mintersByFile?fileContractAddress=${fileContractAddress}&first=${pageSize}&skip=${skip}`);
          const responseJson = await response.json();
          if (responseJson.permissionedFileAccessMinteds) {
            minters.push(...responseJson.permissionedFileAccessMinteds);
            hasMore = responseJson.permissionedFileAccessMinteds.length === pageSize;
          } else {
            hasMore = false;
          }
          skip += pageSize;
        } catch (error) {
          console.error('Error fetching minters:', error);
          // Throw the error to be handled by the calling function
          throw new Error(`Failed to fetch minters: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const mapUserData = (user: any) => {  
        return {
          fileContractAddress: user.fileContractAddress,
          fileIdentifier: user.fileIdentifier,
          fileAccessMinter: user.fileAccessMinter,
          fileMetadata: user.fileMetadata,
        };
      }

    const mintersData = minters.map(mapUserData);
    const mintersAddresses = mintersData
        .flatMap(holder => holder.fileAccessMinter ? [holder.fileAccessMinter] : [])
        .filter(address => address.toLowerCase() !== data.fileMetadata.fileOwner.toLowerCase());
    if (debug) {
        console.log('minters addresses:', mintersAddresses);
    }
    
    // Transform the data into the documented format
    return {
        cid: fileMetadata.encryptedData.ipfsHash,
        dataContractAddress: data.fileMetadata.fileContractAddress,
        dataMetadata: {
            name: fileMetadata.name,
            type: fileMetadata.type,
            mimeType: fileMetadata.mimeType,
            subtype: fileMetadata.subtype,
            userMetaData: fileMetadata.userMetaData ? JSON.stringify(fileMetadata.userMetaData) : undefined
        },
        owner: data.fileMetadata.fileOwner,
        users: mintersAddresses
    };
}