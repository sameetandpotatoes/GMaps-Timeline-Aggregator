import React from 'react';
import oboe from 'oboe';
import moment from 'moment';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {
  init() {
    this.parseJSONFile = this.parseJSONFile.bind(this)
  }

  parseJSONFile(file) {
    var fileSize = file.size;
    console.log("File Size: " + fileSize);
    // var prettyFileSize = prettySize(fileSize);
    // TODO update MB state

		var chunkSize = 512 * 1024; // bytes
		var offset = 0;
		var self = this; // we need a reference to the current object
		var chunkReaderBlock = null;
    
    var startTime = Date.now();
    var endTime = Date.now();
    var SCALAR_E7 = 0.0000001; // Since Google Takeout stores latlngs as integers
    
    function prettyLatLon(lat) {
      return lat * SCALAR_E7;
    }

    var datePointMap = {};

    var oboeInstance = new oboe();
    oboeInstance
      .node('locations.*', function(location) {
        var dateStr = moment(new Date(parseInt(location.timestampMs))).format("MM/DD/YYYY");
        var locEntry = {
          timestamp: parseInt(location.timestampMs),
          lat: prettyLatLon(location.latitudeE7), 
          lon: prettyLatLon(location.longitudeE7)
        };
        if (datePointMap.hasOwnProperty(dateStr)) {
          datePointMap[dateStr].push(locEntry);
        } else {
          datePointMap[dateStr] = [locEntry];
        }
      }).done(function() {
        console.log(datePointMap);
        // display the range of dates (get min / max) and then upon selecting, it should just plot the points for that
      });
    
    var readEventHandler = function ( evt ) {
      if ( evt.target.error == null ) {
        offset += evt.target.result.length;
        var chunk = evt.target.result;
        var percentLoaded = ( 100 * offset / fileSize ).toFixed( 0 );
        console.log(percentLoaded);
        // status( percentLoaded + '% of ' + prettyFileSize + ' loaded...' );
        oboeInstance.emit( 'data', chunk ); // callback for handling read chunk
      } else {
        return;
      }
      if ( offset >= fileSize ) {
        oboeInstance.emit( 'done' );
        return;
      }

      // of to the next chunk
      chunkReaderBlock( offset, chunkSize, file );
    }

    chunkReaderBlock = function ( _offset, length, _file ) {
      var r = new FileReader();
      var blob = _file.slice( _offset, length + _offset );
      r.onload = readEventHandler;
      r.readAsText( blob );
    }

    // now let's start the read with the first block
    chunkReaderBlock( offset, chunkSize, file );
  }
  
  onChangeHandler(e) {
    console.log(e.target.files[0])
    this.parseJSONFile(e.target.files[0])
  }
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>       
          <input type="file" name="file" onChange={this.onChangeHandler.bind(this)}/>
        </header>
      </div>
    );
  }  
}

export default App;
