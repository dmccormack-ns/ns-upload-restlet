import * as encode from "N/encode";
import * as error from "N/error";
import * as file from "N/file";
import * as format from "N/format";
import * as log from "N/log";
import * as record from "N/record";
import * as search from "N/search";

export namespace FileCabinet {
    export namespace Folder {
        interface IFolderLookup {
            id: string | number;
            pathToIdMap: IPathTOIdMap;
        }

        interface IPathTOIdMap {
            [path: string]: string | number;
        }

        export function createFolderR(path: string, lookup: IFolderLookup) {
            const pa = path.split("/");
            log.debug("Path to createFolders from...", path);
            const fpa = pa.slice(1, pa.length - 1);
            let foldersToCreate = [] as string[];
            let existingPath: string = "";
            for (let i = fpa.length; i > 0; --i) {
                const subpath = `/${fpa.slice(0, i + 1).join("/")}`;
                if (subpath in lookup.pathToIdMap) {
                    foldersToCreate = arrayDiff(fpa, fpa.slice(0, i + 1));
                    existingPath = subpath;
                    break;
                }
            }
            for (const dir of foldersToCreate) {
                log.debug("Going to create", dir);
                log.debug("Existing Path is: ", existingPath);
                const newFolder = record.create({ // 5 governance
                    type: record.Type.FOLDER,
                    isDynamic: true,
                });
                newFolder.setValue({
                    fieldId: "name",
                    value: dir,
                });
                if (existingPath) {
                    newFolder.setValue({
                        fieldId: "parent",
                        value: lookup.pathToIdMap[existingPath],
                    });
                }
                const folderId = newFolder.save();
                existingPath += `/${dir}`;
                lookup.pathToIdMap[existingPath] = folderId; // 10 governance
            }
            lookup.id = lookup.pathToIdMap[existingPath];
            return lookup;
        }

        function arrayDiff(a1: any[], a2: any[]) {
            return a1.concat(a2).filter((val) => {
                return !(a1.indexOf(val) > -1 && a2.indexOf(val) > -1);
            });
        }

        function getFolderId(folderName: string, parentId: string) {
            const s = search.create({
                type: search.Type.FOLDER,
                columns: ["internalid"],
                filters: [
                    ["name", search.Operator.IS, folderName],
                    "AND",
                    ["parent", search.Operator.ANYOF, parentId],
                ],
            });

            const results = s.runPaged();

            if (results.count === 0) {
                // log.debug("Didn't find folder: ", `${folderName} with Parent: ${parentId}`);
                return "-1";
            } else if (results.count > 1) {
                throw error.create({
                    name: "DUPL_FOLDER_FOUND",
                    message: "Somehow found a  folder with the same name and same parent ID",
                });
            }

            const folderId = results.fetch({
                index: 0,
            }).data[0].id;
            return folderId as string;
        }

        export function lookupFolder(path: string) {
            // log.debug("Looking up path", path);
            const pa = path.substring(1).split("/");
            // log.debug("path to array: ", pa.slice(0, pa.length - 1));
            let prevFolder = "@NONE@";
            const lookup: IFolderLookup = {
                id: "-1",
                pathToIdMap: {} as IPathTOIdMap,
            };

            // omit empty "/" and filename from folder search
            pa.slice(0, pa.length - 1).forEach((folderName, index, pathArray) => {
                const folderId = getFolderId(folderName, prevFolder);
                const fullpath = pathArray.slice(0, index + 1).join("/") as string;
                if (folderId === "-1") {
                    lookup.id = folderId;
                    return lookup;
                } else {
                    lookup.pathToIdMap[`/${fullpath}`] = folderId;
                }
                lookup.id = folderId;
                prevFolder = folderId;
            });
            // log.debug("lookup is", lookup.pathToIdMap);
            return lookup;
        }

    }

    export namespace File {
        interface IFileInfo {
            nsfileext: file.Type;
            fname: string;
            dir: string;
            content: string;
        }

        export function getExtension(fullpath: string) {
            const fpa = fullpath.split("/");
            const fin = fpa.pop() || ".";
            const ext = fin.split(".").pop() || "";
            if (ext in FILETYPES.EXT) {
                return FILETYPES.EXT[ext];
            } else {
                return file.Type.PLAINTEXT;
            }
        }

        export function getPath(fullpath: string) {
            const pathArray = fullpath.split("/");
            pathArray.pop();
            return pathArray.join("/");
        }

        export function getFName(fullpath: string) {
            const pathArray = fullpath.split("/");
            return pathArray.pop() || "";
        }

        export function getContent(content: string, ext: file.Type) {
            if (FILETYPES.NON_BIN.indexOf(ext) > - 1) {
                return encode.convert({ // 0 governance
                    string: content,
                    inputEncoding: encode.Encoding.BASE_64,
                    outputEncoding: encode.Encoding.UTF_8,
                }) || "";
            } else {
                return content || " ";
            }
        }

        export function fileExists(f: IFileInfo) {
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

        export function overWriteFile(newFile: IFileInfo, oldFile: file.File) {
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
    }
}

export namespace FILETYPES {
    export const NON_BIN = [
        file.Type.CSV,
        file.Type.HTMLDOC,
        file.Type.JAVASCRIPT,
        file.Type.MESSAGERFC,
        file.Type.PLAINTEXT,
        file.Type.POSTSCRIPT,
        file.Type.RTF,
        file.Type.SMS,
        file.Type.STYLESHEET,
        file.Type.XMLDOC,
        "CONFIG",
    ];
    export const EXT = {
        dwg: file.Type.AUTOCAD,
        bmp: file.Type.BMPIMAGE,
        csv: file.Type.CSV,
        config: "CONFIG",
        xls: file.Type.EXCEL,
        swf: file.Type.FLASH,
        gif: file.Type.GIFIMAGE,
        gz: file.Type.GZIP,
        htm: file.Type.HTMLDOC,
        html: file.Type.HTMLDOC,
        ico: file.Type.ICON,
        js: file.Type.JAVASCRIPT,
        jpg: file.Type.JPGIMAGE,
        eml: file.Type.MESSAGERFC,
        mp3: file.Type.MP3,
        mpg: file.Type.MPEGMOVIE,
        mpp: file.Type.MSPROJECT,
        pdf: file.Type.PDF,
        pjpeg: file.Type.PJPGIMAGE,
        txt: file.Type.PLAINTEXT,
        png: file.Type.PNGIMAGE,
        ps: file.Type.POSTSCRIPT,
        ppt: file.Type.POWERPOINT,
        mov: file.Type.QUICKTIME,
        rtf: file.Type.RTF,
        sms: file.Type.SMS,
        css: file.Type.STYLESHEET,
        tiff: file.Type.TIFFIMAGE,
        vsd: file.Type.VISIO,
        doc: file.Type.WORD,
        xml: file.Type.XMLDOC,
        zip: file.Type.ZIP,
    };
}
