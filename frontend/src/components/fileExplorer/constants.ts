import type { FileItem } from './hooks';

export const DEFAULT_PATH = 'C:\\Users\\Lukas\\Documents';
export const FALLBACK_FOLDER = 'Folder';

export const MOCK_FOLDER_CONTENTS: FileItem[] = [
    { name: 'File1.txt', type: 'file' },
    { name: 'File2.txt', type: 'file' },
    { name: 'Subfolder', type: 'folder' },
    { name: 'AnotherFile.docx', type: 'file' },
    { name: 'ZippedFolder.zip', type: 'folder' },
    { name: 'Image.png', type: 'file' },
    { name: 'Music.mp3', type: 'file' },
    { name: 'Projects', type: 'folder' },
    { name: 'Notes.txt', type: 'file' },
    { name: 'Archive.rar', type: 'folder' },
    { name: 'Presentation.pptx', type: 'file' },
    { name: 'Videos', type: 'folder' },
    { name: 'Spreadsheet.xlsx', type: 'file' },
    { name: 'OldFiles', type: 'folder' },
];
