const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();

const Bucket = process.env.BUCKET_NAME;
const transforms = [
    { name: "thumbnail", width: 400 },
    { name: "medium", width: 800 },
    { name: "large", width: 1280 },
    { name: "xlarge", width: 1920 },
];

exports.handler = async (event, context, callback) => {
    const key = event.Records[0].s3.object.key;
    const sanitizedKey = key.replace(/\+/g, " ");
    const parts = sanitizedKey.split("/");
    const filename = parts[parts.length - 1];

    try {
        const image = await s3.getObject({ Bucket, Key: sanitizedKey }).promise();

        await Promise.all(
            transforms.map(async item => {
                const resizedImg = await sharp(image.Body)
                    .resize({ width: item.width })
                    .toBuffer();

                return await s3
                    .putObject({
                        Bucket: Bucket,
                        Body: resizedImg,
                        Key: `image/${item.name}/${filename}`
                    })
                    .promise();
            })
        );
        console.log('end');
        callback(null, `Success: ${filename}`);
    } catch (err) {
        callback(`Error resizing files: ${err}`);
    }
};