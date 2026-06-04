import multer from "multer";

export const uploadDatabase = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 10240 * 10240, 
    },
});