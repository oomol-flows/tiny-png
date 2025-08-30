//#region generated meta
type Inputs = {
    item: any;
    destination_folder: string | null;
};
type Outputs = {
    output_image: string | null;
};
//#endregion

import type { Context } from "@oomol/types/oocana";
import * as fs from 'fs';
import * as path from 'path';

export default async function(
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    const { item, destination_folder } = params;

    // 如果 destination_folder 为空，直接返回 null
    if (!destination_folder) {
        return { output_image: null };
    }

    try {
        // 确保目标文件夹存在
        if (!fs.existsSync(destination_folder)) {
            fs.mkdirSync(destination_folder, { recursive: true });
        }

        // 获取文件名
        const fileName = path.basename(item);
        const destinationPath = path.join(destination_folder, fileName);

        // 复制图片到目标文件夹
        fs.copyFileSync(item, destinationPath);

        return { output_image: destinationPath };
    } catch (error) {
        console.error('处理图片时出错:', error);
        return { output_image: null };
    }
};