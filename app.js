const express = require('express');
const app = express();
const AWS = require('aws-sdk');

function assumeRole() {
    const sts = new AWS.STS();
    const assumeRoleParams = {
        RoleArn: 'arn:aws:iam::171578128461:role/moosic-s3-access',
        RoleSessionName: 'MoosicSession'
    }

    const assumeRole = sts.assumeRole(assumeRoleParams).promise();

    return assumeRole
        .then(res => {
            const assumedRoleCredentials = {
                accessKeyId: res.Credentials.AccessKeyId,
                secretAccessKey: res.Credentials.SecretAccessKey,
                sessionToken: res.Credentials.SessionToken
            };
            s3 = new AWS.S3(assumedRoleCredentials);
            return Promise.resolve(s3);
        })
        .catch(err => {
            console.log(`Whoopsie daisies! Looks like an error occured when trying to assume role: ${err.message}`);
            return Promise.reject(err);
        });
}

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

app.get('/', function (req, res) {
    assumeRole()
        .then(s3Client => {
            const params = {
                Bucket: 'bucket-o-moosic'
            };
            return s3Client.listObjectsV2(params).promise();
        })
        .then(res => {
            const files = convertFilePathsToObjects(res.Contents);
            res.send(files);
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(3000);
