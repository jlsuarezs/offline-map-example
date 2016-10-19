import { Component } from '@angular/core';
//import * as Leaflet from "leaflet";
import { NavController, Platform } from 'ionic-angular';

declare var L: any;
declare var sqlitePlugin;


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  map: any;

  constructor(public navCtrl: NavController, platform: Platform) {
    // source: https://github.com/stdavis/OfflineMbTiles/blob/master/www/js/TileLayer.MBTiles.js
    console.log("[[MapPage.constructor]");        
    L.TileLayer.MBTiles = L.TileLayer.extend({
      mbTilesDB: null,

      initialize: function(url, options, db) {
        this.mbTilesDB = db;
        L.Util.setOptions(this, options);
      },

      getTileUrl: function(tilePoint, zoom, tile) {
        var z = this._getZoomForUrl();
        console.log("[MapPage.getTileUrl] In getTileUrl, zoom level: ", z);
        z = Math.round(z);
        var x = tilePoint.x;
        var y = tilePoint.y;
        y = Math.pow(2, z) - y - 1;
        var base64Prefix = 'data:image/gif;base64,';
        this.mbTilesDB.transaction((tx) => {
          console.log(`[MapPage.getTileUrl] SELECT tile_data FROM tiles WHERE zoom_level = ${z} AND tile_column = ${x} AND tile_row = ${y};` );
          tx.executeSql("SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?;", [z, x, y], (tx, res) => {
              tile.src = base64Prefix + res.rows.item(0).tile_data;
          }, (err, msg) => {
            console.log('[MapPage.getTileUrl] error with executeSql', err);
            console.log('[MapPage.getTileUrl] message ', msg);
          });
        }, (err, msg) => {
          console.log("[MapPage.getTileUrl] Transaction err:", err);
          console.log(err)
        });
      },
      _loadTile: function(tile, tilePoint, zoom) {
        tile._layer = this;
        tile.onload = this._tileOnLoad;
        tile.onerror = this._tileOnError;
        this.getTileUrl(tilePoint, zoom, tile);
      }
    });


    platform.ready().then(() => {
        let mbTiles = 'newport_z14.mbtiles';
        let layerName = 'Offline Layer';
        let maxZoom = 13;
        if (window.sqlitePlugin) {
          this.initializeMbtiles(mbTiles, layerName, maxZoom);
        } else {
          console.log("[MapPage.ngOnInit]Could not find window.sqlitePlugin");
        }
    });
  }

  ngOnInit() {
    this.map = L.map('map').setView([44.65, -123.91], 10);
    // if (window.sqlitePlugin) {
    //   this.initializeMbtiles(mbTiles, layerName, maxZoom);
    // } else {
    //   console.log("[MapPage.ngOnInit]Could not find window.sqlitePlugin");
    // }
  }

  /**
   * @async
   * This function opens the Sqlite database and passes the connection on
   * to the L.TileLayer.MBTiles for initialization.
   * It also adds the layer to the baseLayers array
   */
  initializeMbtiles(mbtilePath: string, layerName: string, maxZoom: number) {
    let dbconn;
    console.log("[MapPage.initializeMbtiles()] Going to use local tiles, from ", mbtilePath);
    window.sqlitePlugin.openDatabase({ name: mbtilePath, location: 'default', createFromLocation: 1, androidDatabaseImplementation: 2 },
      (dbconn) => {
        console.log("[MapPage.initializeMbtiles] window.sqlitePlugin.openDatabase success");
        var layer = new L.TileLayer.MBTiles('', { maxZoom: maxZoom, scheme: 'tms' }, dbconn);
        var key = layerName;
        layer.addTo(this.map)
        //this.baseLayers[key] = layer;
        //this.baseLayersArray.push(layer);

        console.log("[MapPage.initializeMbtiles] window.sqlitePlugin.openDatabase - Done loading layer", layer);
        

      }, (error) => {
        console.log("[initializeMbtiles] Failed to open mbtiles DB");
        console.log(error);
      });
  }




}
