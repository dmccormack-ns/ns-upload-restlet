/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType RESTLet
 */

import * as encode from "N/encode";
import * as error from "N/error";
import * as file from "N/file";
import * as format from "N/format";
import * as log from "N/log";
import * as search from "N/search";
import { EntryPoints } from "N/Types";
import { FileCabinet } from "./filecabinet/filecabinet";
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
    log.debug("Received request", request);
    switch (request.action) {
        case "upload":
            return upload(request);
        default:
            return request;
    }
}
// TODO REFACTOR FILECABINET SPECIFICS INTO SEPARATE MODULE
function upload(request: IPOSTRequest) {
    const resp: IPOSTResponse = {
        code: 0,
        message: request,
    };
    const fullpath: string = `${cleanPath(request.rootpath)}/${cleanPath(request.filepath)}`;
    const fi = getFile(fullpath, request.content, true);

    const nsfi = FileCabinet.File.fileExists(fi);
    if (nsfi) {
        FileCabinet.File.overWriteFile(fi, nsfi);
        log.debug("Overwrote File", nsfi);
        return "SUCCESS";
    } else {
        let nsFolder = FileCabinet.Folder.lookupFolder(fullpath);
        if (nsFolder.id !== "-1") {
            const nfi = file.create({
                name: fi.fname,
                folder: format.parse({
                    value: nsFolder.id,
                    type: format.Type.INTEGER,
                }) as number,
                contents: fi.content,
                fileType: fi.nsfileext,
            });
            const id = nfi.save();
            log.debug("Created file: ", nfi);
            return "SUCCESS";
        } else {
            nsFolder = FileCabinet.Folder.createFolderR(fullpath, nsFolder);
            const nfi = file.create({
                name: fi.fname,
                folder: nsFolder.id as number,
                contents: fi.content,
                fileType: fi.nsfileext,
            });
            nfi.save();
            log.debug("Created file: ", nfi);
            return "SUCCESS";
        }
    }
}
// file.create({
//     name: "test.txt",
//     fileType: file.Type.PLAINTEXT,
//     contents: "asdf",
//     folder: 123,
// })

function getFile(fullpath: string, content: string, createFolders: boolean) {
    const i: IFileInfo = {
        fname: FileCabinet.File.getFName(fullpath),
        nsfileext: FileCabinet.File.getExtension(fullpath),
        dir: FileCabinet.File.getPath(fullpath),
        content: FileCabinet.File.getContent(content, FileCabinet.File.getExtension(fullpath)),
    };
    return i;
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
