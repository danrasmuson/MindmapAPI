var request = require('request-promise');
var parseString = require('xml2js').parseString;
var Rx = require('rx');
var _ = require('lodash');
var md5 = require('md5');
require('dotenv').load(); // load .env

const angelHackMapId = '415467547';

function calculateSignature(params){
  const SHARED_KEY = process.env.MINDMAP_SHARED;
  return md5(
    SHARED_KEY+
    Object.keys(params)
      .sort()
      .map((key)=>{
        return key+params[key]
      })
      .join('')
  )
}

function _get(config){
  let qs = {
    api_key: process.env.MINDMAP_SECRET,
    auth_token: process.env.MINDMAP_TOKEN,
    response_format: 'xml',
  };
  _.assign(qs, config)
  qs.api_sig = calculateSignature(qs);

  return Rx.Observable.create((observer)=>{
    request
      .get({
        url: "https://www.mindmeister.com/services/rest",
        qs: qs
      })
      .then((xml)=>{
        parseString(xml, (err, result)=>{
          if (err){
            observer.onError(err);
          } else{
            observer.onNext(result);
          }
        })
      })
      .catch((err)=>{
        observer.onError(err);
      });
  });
}

function maps(){
  return Rx.Observable.create((observer)=>{
    _get({
        method: 'mm.maps.getList',
      })
      .forEach((data)=>{
        observer.onNext(data.rsp.maps[0].map);
      }, (err)=>{
        observer.onError(err)
      })
  });
}

function getNodes(mapId){
  return Rx.Observable.create((observer)=>{
    _get({
        method: 'mm.maps.getSlides',
        map_id: mapId
      })
      .forEach((data)=>{
        observer.onNext(data.rsp.err);
      }, (err)=>{
        observer.onError(err)
      })
  });
}


// maps(angelHackMapId).forEach((nodes)=>{
//   console.log(nodes);
// })