import React from 'react';
import moment from 'moment';
import oboe from 'oboe';
import logo from './logo.svg';
import GoogleMapsViewer from './GoogleMapsViewer.js';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.parseJSONFile = this.parseJSONFile.bind(this);

    this.state = {
      isFileUploaded: false,
      locs: null
    };
  }

  componentDidMount() {
    if (localStorage.getItem("fileUpload") !== null) {
      this.setState({isFileUploaded: true, locs: JSON.parse(localStorage.getItem("fileUpload"))});
    }
  }

  parseJSONFile(file) {
    // TODO update MB state
    var fileSize = file.size;    

    this.setState({
      isFileUploaded: false,
      locs: {
        fileSize: fileSize,
        parsePct: 0,
        datePoints: [],
        startDate: null, // Start date of the data, as a moment obj
        endDate: null, // End date of the data, as a moment obj
      }
    });


		var chunkSize = 512 * 1024; // bytes
		var offset = 0;
		var chunkReaderBlock = null;
    
    function prettyLatLon(lat) {
      var SCALAR_E7 = 0.0000001; // Since Google Takeout stores latlngs as integers
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
        var dateSpread = Object.keys(datePointMap).sort();
        var earliestDate = moment(dateSpread[0], 'MM/DD/YYYY');
        var latestDate = moment(dateSpread[dateSpread.length - 1], 'MM/DD/YYYY');
        // var dateRange = moment.range(earliestDate, latestDate);

        // var allDates = [];
        // // Iterate through range by day and store each date in a list
        // for (let date of dateRange.reverseBy('days')) {
        //   allDates.push(date.format("MM/DD/YYYY"));
        // }
        
        var locs = {...this.state.locs};
        locs.datePoints = datePointMap;
        locs.startDate = earliestDate;
        locs.endDate = latestDate;
        this.setState({isFileUploaded: true, locs});

        localStorage.setItem("fileUpload", JSON.stringify(this.state.locs));
        console.log("Wrote file to local storage");
      }.bind(this));
    
    var readEventHandler = function (evt) {
      if ( evt.target.error == null ) {
        offset += evt.target.result.length;
        var chunk = evt.target.result;
        var percentLoaded = (100 * offset / fileSize ).toFixed(0);

        var locs = {...this.state.locs};
        locs.parsePct = percentLoaded;
        this.setState({locs});
        
        oboeInstance.emit('data', chunk);
      } else {
        return;
      }
      if (offset >= fileSize) {
        oboeInstance.emit('done');
        return;
      }

      chunkReaderBlock(offset, chunkSize, file);
    }.bind(this);

    // Define a function to read a chunk of the json
    chunkReaderBlock = function(_offset, length, _file) {
      var r = new FileReader();
      var blob = _file.slice(_offset, length + _offset);
      r.onload = readEventHandler;
      r.readAsText(blob);
    }
    chunkReaderBlock(offset, chunkSize, file);
  }
  
  onChangeHandler(e) {
    this.parseJSONFile(e.target.files[0])
  }

  onNewFile() {
    // Redirect back to home page
    localStorage.removeItem("fileUpload");
    this.setState({isFileUploaded: false, locs: null});
  }
  
  render() {
    return (
      <div className="App">
        { !this.state.isFileUploaded &&
          <header className="App-header">
            <h2>Google Maps Timeline Aggregator</h2>

            <h5>Motivation</h5>
            <p>
              The Timeline feature in Google Maps is a pretty interesting way to track your whereabouts throughout a day, but it only limits you to one day at a time. This tool can provide a quick way for you to see that data over a period of time. The tool works best when you are in the same city / location in that period of time (e.g visiting a new city).
            </p>
            <input type="file" name="file" onChange={this.onChangeHandler.bind(this)}/>
            { this.state.locs &&
              <p>{this.state.locs.parsePct}% of {this.state.locs.fileSize} bytes loaded...</p>
            }
          </header>
        }
        
        { this.state.isFileUploaded && 
          <GoogleMapsViewer locs={this.state.locs} onNewFile={this.onNewFile.bind(this)}/> 
        }
      </div>
    );
  }  
}

export default App;
