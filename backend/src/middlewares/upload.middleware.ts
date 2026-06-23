import multer from "multer";

export const uploadDatabase = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024, 
    },
});

export const upload = multer({
    storage: multer.memoryStorage(),
});