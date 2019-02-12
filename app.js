const express = require('express');
const AWS = require('aws-sdk');
const _ = require('lodash');
const bodyParser = require('body-parser');

const BUCKET = 'bucket-o-moosic';

const app = express();

function convertFilePathsToObjects(filePaths) {
    return _.map(filePaths, s3Object => {
        const fileNameParts = s3Object.Key.split('/');
        if (fileNameParts.length === 1) {
            return { song: fileNameParts[0] }
        } else if (fileNameParts.length === 2) {
            return { song: fileNameParts[1], album: fileNameParts[0] }
        } else {
            return { song: fileNameParts[2], album: fileNameParts[1], artist: fileNameParts[0] }
        }
    });
}

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

app.get('/', function (req, res) {
    const s3Client = new AWS.S3();
    const params = {
        Bucket: BUCKET
    };
    s3Client.listObjectsV2(params).promise()
        .then(s3Response => {
            const files = convertFilePathsToObjects(s3Response.Contents);
            res.send(files);
        })
        .catch(err => {
            console.log(err);
        });
});

app.post('/', function (req, res) {
    const s3Client = new AWS.S3();
    const params = {
        Bucket: BUCKET,
        Key: _.get(req, 'body.key')
    }
    console.log(`Fetching signed URL for S3 key: ${params.Key}`);
    const url = s3Client.getSignedUrl('getObject', params);
    console.log(`Retrieved URL: ${url}`);
    res.status(200).send({ url });
});

app.listen(3000);
