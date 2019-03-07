# moosic-api

API to query moosic stored in DynamoDB and S3

## Response Codes
* 200 -- Successful request
* 400 -- Bad request
* 404 -- Nothing found for query
* 500 -- Internal server error

## Routes

### GET /genres
* Queries the DynamoDB `music` table and returns an array of all genres

**Sample Request**
```json
GET https://localhost:3000/genres
```

**Sample Response**
```json
Status code: 200
[
	"country",
	"pop",
	"rap"
]
```

### GET /artists/for/genre
* Queries the DynamoDB `music` table and returns an array of all artists for the given genre

**Sample Request**
```json
GET https://localhost:3000/artists/for/genre?genre=pop
```

**Sample Response**
```json
Status code: 200
[
	"hannah-montana",
	"miley-cyrus"
]
```

### GET /albums/for/artist
* Queries the DynamoDB `music` table and returns an array of all albums for the given artist

**Sample Request**
```json
GET https://localhost:3000/albums/for/artist?artist=miley-cyrus
```

**Sample Response**
```json
Status code: 200
[
	"bangerz",
	"cant-be-tamed",
	"breakout"
]
```

### GET /songs/for/album
* Queries the DynamoDB `music` table and returns an array of all songs for the given album

**Sample Request**
```json
GET https://localhost:3000/songs/for/album?album=bangerz
```

**Sample Response**
```json
Status code: 200
[
	"we-cant-stop",
	"wrecking-ball",
	"adore-you"
]
```

### GET /song
* Queries the DynamoDB `music` table and returns a signed URL for S3 for the given song

**Sample Request**
```json
GET https://localhost:3000/song?song=wrecking-ball
```

**Sample Response**
```json
Status code: 200
{
    "url": "https://bucket-o-moosic.s3.amazonaws.com/pop/miley-cyrus/bangerz/wrecking-ball?AWSAccessKeyId=ACCESS_KEY&Signature=SIGNATURE"
}
```

### POST /save-user
* Saves a user's data to the DynamoDB `users` table

**Sample Request**
```json
POST http://localhost:3000/save-user
{
	"name": "Miley Cyrus",
	"email": "mcyrus@gmail.com",
	"id": "abc123"
}
```

**Sample Response**
```json
Status code: 200
{ }
```
