# Item object
* _id: time based generated id 
* type: type of the object; required

## Info section
* caption: object title, required
* slug: normalized caption for URL, required, unique, indexed
* date: published timestamp, required, indexed. Order of _id and info.date may not be aligned.
* published: published flag, required
* picture: stream picture path from root; required
* tags: array of tags

### Author section
* nickname: user nickname
* id: user id

## Data section
* depends on type of object

## Comments section
* count: count of all comments; required
* last: timestamp of the last comment
