const express = require('express');
const AWS = require('aws-sdk');
const _ = require('lodash');
const bodyParser = require('body-parser');
const { query, validationResult } = require('express-validator/check');

const BUCKET = 'bucket-o-moosic';
const MUSIC_TABLE = 'music';
const USER_TABLE = 'users';

const app = express();

function queryDynamoDb(params) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

    return documentClient.query(params).promise();
}

function scanDynamoDb(params) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

    return documentClient.scan(params).promise();
}

function upsertDynamoDb(params) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

    return documentClient.put(params).promise();
}

function getSignedUrl(key) {
    const s3Client = new AWS.S3();
    const params = {
        Bucket: BUCKET,
        Key: key
    }

    return new Promise(function(resolve, reject) {
        s3Client.getSignedUrl('getObject', params, function (err, url) {
            if (err) {
                console.log(`Dang flabbit an error occured fetching the URL: ${err}`);
                return reject(err);
            } else {
                console.log(`Retrieved URL: ${url}`);
                return resolve(url);
            }
        });
    });
}

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

app.get('/genres', function (req, res) {
    const params = {
        TableName : MUSIC_TABLE,
        AttributesToGet: ['genre']
    };

    scanDynamoDb(params)
        .then(items => {
            if (items.Count < 1) {
                return res.status(404).send('No genres found');
            }
            return res.status(200).send(_.uniq(_.map(items.Items, item => item.genre)));
        })
        .catch(err => {
            return res.status(500).send(err);
        });
});

app.get('/artists/for/genre', [
        query('genre', 'Missing genre query parameter').exists({ checkFalsy: true })
    ],
    (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).send(validationErrors.array());
        }

        const genre = req.query.genre;

        const params = {
            TableName: MUSIC_TABLE,
            KeyConditionExpression: 'genre = :genre',
            ExpressionAttributeValues: {
                ':genre': genre            }
        };

        queryDynamoDb(params)
            .then(items => {
                if (items.Count < 1) {
                    return res.status(404).send(`No artists found for genre ${genre}`);
                }
                return res.status(200).send(_.uniq(_.map(items.Items, item => item.artist)));
            })
            .catch(err => {
                return res.status(500).send(err);
            });
    }
);

app.get('/albums/for/artist', [
        query('artist', 'Missing artist query parameter').exists({ checkFalsy: true })
    ],
    (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).send(validationErrors.array());
        }

        const artist = req.query.artist;

        const params = {
            TableName: MUSIC_TABLE,
            IndexName: 'artistAlbum',
            KeyConditionExpression: 'artist = :artist',
            ExpressionAttributeValues: {
                ':artist': artist
            }
        };

        queryDynamoDb(params)
            .then(items => {
                if (items.Count < 1) {
                    return res.status(404).send(`No albums found for artist ${artist}`);
                }
                return res.status(200).send(_.uniq(_.map(items.Items, item => item.album)));
            })
            .catch(err => {
                return res.status(500).send(err);
            });
    }
);

app.get('/songs/for/album', [
        query('album', 'Missing album query parameter').exists({ checkFalsy: true })
    ],
    (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).send(validationErrors.array());
        }

        const album = req.query.album;

        const params = {
            TableName: MUSIC_TABLE,
            IndexName: 'albumSong',
            KeyConditionExpression: 'album = :album',
            ExpressionAttributeValues: {
                ':album': album
            }
        };

        queryDynamoDb(params)
            .then(items => {
                if (items.Count < 1) {
                    return res.status(404).send(`No songs found for album ${album}`);
                }
                return res.status(200).send(_.uniq(_.map(items.Items, item => item.song)));
            })
            .catch(err => {
                return res.status(500).send(err);
            });
    }
);

app.get('/song', [
        query('song', 'Missing song query parameter').exists({ checkFalsy: true })
    ],
    (req, res) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            return res.status(400).send(validationErrors.array());
        }

        const song = req.query.song;

        const params = {
            TableName : MUSIC_TABLE,
            FilterExpression: 'song = :song',
            ExpressionAttributeValues : { ':song' : song }
        };

        scanDynamoDb(params)
            .then(items => {
                if (items.Count < 1) {
                    return res.status(404).send(`Song ${song} not found`);
                }
                return getSignedUrl(items.Items[0].s3Key);
            })
            .then(url => {
                return res.status(200).send({ url });
            })
            .catch(err => {
                return res.status(500).send(err);
            });
    }
);

app.post('/save-user', (req, res) => {
    const params = {
        Item: {
            name: req.body.name,
            email: req.body.email,
            id: req.body.id
        },
        TableName: USER_TABLE
    };

    upsertDynamoDb(params)
        .then(dynamoRes => {
            return res.status(200).send(dynamoRes);
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send(err);
        })
});

app.listen(3000);
