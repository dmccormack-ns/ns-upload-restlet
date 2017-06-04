/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType RESTLet
 */

import * as encode from "N/encode";
import * as error from "N/error";
import * as file from "N/file";
import * as log from "N/log";
import * as search from "N/search";
import { EntryPoints } from "N/Types";
import { ErrorCodes } from "./nsu_error_codes";
import { FILETYPES } from "./nsu_file_types";

interface IPOSTRequest {
    action: string;
    filepath: string;
    rootpath: string;
    content: string;
}

interface IFileInfo {
    nsfileext: file.Type;
    fname: string;
    dir: string;
    content: string;
}

interface IPOSTResponse {
    message: string | IPOSTRequest;
    code: number;
}

interface INSError {
    name: string;
    message: string;
    id: string;
    stack: [string];
}

export function post(request: IPOSTRequest) {
    // routing
    switch (request.action) {
        case "upload":
            return upload(request);
    }
}

function upload(request: IPOSTRequest) {
    const resp: IPOSTResponse = {
        code: 0,
        message: request,
    };
    const fi = getFile(cleanPath(request.filepath), cleanPath(request.rootpath), request.content, true);
    log.debug("Request was: ", resp);
    return resp;
    //    validateRequest(request);
    //    const i = pathInfo(request.filepath, request.rootpath, true);
    //    const body = request.content;
    //    if (~FILETYPES.NON_BIN.indexOf(i.nsfileext)) {

    //    }
}

// file.create({
//     name: "test.txt",
//     fileType: file.Type.PLAINTEXT,
//     contents: "asdf",
//     folder: 123,
// })

function getFile(fullpath: string, baseIn: string, content: string, createFolders: boolean) {
    const i: IFileInfo = {
        fname: getFName(fullpath),
        nsfileext: getExtension(fullpath),
        dir: getPath(fullpath, baseIn),
        content: getContent(content, getExtension(fullpath)),
    };
}

function getExtension(fullpath: string) {
    const fpa = fullpath.split("/");
    const fin = fpa.pop() || ".";
    const ext = fin.split(".").pop() || "";
    if (ext in FILETYPES.EXT) {
        return FILETYPES.EXT[ext];
    }
}

function getPath(fullpath: string, baseIn: string) {
    fullpath = `${baseIn}/${fullpath}`;
    const pathArray = fullpath.split("/");
    pathArray.pop();
    return pathArray.join("/");
}

function getFName(fullpath: string) {
    const pathArray = fullpath.split("/");
    return pathArray.pop();
}

function getContent(content: string, ext: file.Type) {
    if (FILETYPES.NON_BIN.indexOf(ext) < 0) {
        return encode.convert({ // 0 governance
            string: content,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8,
        });
    } else {
        return content;
    }
}

// recursively creates folders if not existing
function createFolderR(path: string) {
    return true;
}

function lookupFolder(path: string) {
    return true;
}

function fileExists(f: IFileInfo) {
    try {
        const tmpFile = file.load({ // 10 governance
            id: `${f.dir}/${f.fname}`,
        });
        return tmpFile;
    } catch (e) {
        if (e.name === "RCRD_DSNT_EXIST") {
            return false;
        } else {
            throw e;
        }
    }
}

function overWriteFile(newFile: IFileInfo, oldFile: file.File) {
    if (newFile.content === oldFile.getContents()) { // 0 governance
        return true;
    } else {
        const folderId: number = oldFile.folder;
        file.delete({ // 20 governance
            id: oldFile.id,
        });
        const createdFile = file.create({ // 0 governance
            name: newFile.fname,
            fileType: newFile.nsfileext,
            folder: oldFile.folder,
            contents: newFile.content,
        });
        createdFile.save(); // 20 governance
        return true;
    }
}

function cleanPath(path: string) {
    return path.replace(/[\\]/g, "/");
}

function validateRequest(request: IPOSTRequest) {
    if (!request.filepath) {
        throw error.create({ // 0 governance
            name: ErrorCodes.INVLD_PARAM,
            message: "No file path specified",
        });
    }
    if (!request.rootpath) {
        throw error.create({ // 0 governance
            name: ErrorCodes.INVLD_PARAM,
            message: "No destination root path specified",
        });
    }
}
