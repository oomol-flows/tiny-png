import { Context } from "@oomol/types/oocana";

//#region generated meta
type Inputs = {
    images: string[];
};
type Outputs = {
    images: string[];
};
//#endregion

export default async function(
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {

    try {
        // Assuming the input string is a JSON representation of a string array
        const filePaths: string[] = params.images;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];

        const imageFiles = filePaths.filter(filePath => {
            const lowerFilePath = filePath.toLowerCase();
            return imageExtensions.some(ext => lowerFilePath.endsWith(ext));
        });

        return { images: imageFiles };

    } catch (error) {
        console.error("Error processing images input:", error);
        // Return an empty array or handle the error as appropriate
        return { images: [] };
    }
};