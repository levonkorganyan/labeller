const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const md5 = require('md5');
const { db, Images, Classes, Labels } = require('./database');

export const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

let isDBSynced = false;

const pushToDB = (data) => {
  const imageURLHash = md5(data.url);
  console.log(imageURLHash);
  const classNameHash = md5(data.class);
  console.log(data.class);

  const push = () => {
    Images.upsert({ id: imageURLHash, url: data.url })
      .then(() => Classes.upsert({ id: classNameHash, name: data.class }))
      .then(() => Labels.create({
        top: data.rect.top, left: data.rect.left,
        width: data.rect.width, height: data.rect.height,
        image_id: imageURLHash,
        class_id: md5(data.class)
      }));
  }

  if (!isDBSynced) {
    db.sync()
      .then(() => {
        isDBSynced = true;
        push();
      });
  } else {
    push();
  }
};

// TODO: In future, check data types as well
const isValidPayload = (body) => {
  const allKeysIncluded = (targetKeys, obj) => targetKeys.filter(k => Object.keys(obj).includes(k)).length === targetKeys.length;
  const allValuesNonNull = (obj) => Object.values(obj).filter(v => v !== null).length == Object.values(obj).length;

  const VALID_KEYS = ['url', 'rect', 'class'];
  if (!allKeysIncluded(VALID_KEYS, body)) return false;
  if (!allValuesNonNull(body)) return false;

  const RECT_KEYS = ['left', 'top', 'width', 'height'];
  if (!allKeysIncluded(RECT_KEYS, body.rect)) return false;
  if (!allValuesNonNull(body.rect)) return false;

  return true;
};

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* GET api listing. */
app.get('/', (req, res) => {
  const send = () => {
    Images.findAll(
      {
        include: [{
          model: Labels,
          include: [
            Classes
          ]
        }]
      })
      .then(results => { res.send(results); });
  };

  if (!isDBSynced) {
    db.sync()
      .then(() => {
        isDBSynced = true;
        send();
      });
  } else {
    send();
  }
});

app.put('/', function (req, res) {
  // Check valid payload
  if (!isValidPayload(req.body)) {
    console.log('Received invalid payload');
    return;
  };
  pushToDB(req.body);
});
