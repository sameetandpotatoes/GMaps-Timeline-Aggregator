import React from 'react';
import DatePicker from 'react-datepicker';
import GoogleMapReact from 'google-map-react';
import PropTypes from 'prop-types';

import './GoogleMapsViewer.css';
import "react-datepicker/dist/react-datepicker.css";

import { GOOGLE_MAPS_API_KEY } from './keys.js';

import Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);

class GoogleMapsViewer extends React.Component {
    // Random center for Google Maps, gets overridden by marker rendering
    static defaultProps = {
        center: {
            lat: 59.95,
            lng: 30.33
        }
    };

    constructor(props) {
        super(props)

        this.state = {
            selectedDates: [],
            dateToColorMappings: {},
            refreshMapCounter: 0,
            features: [],
            earliestDate: null,
            latestDate: null,
            startDate: null,
            endDate: null
        }
    }

    componentDidMount() {
        const earliestDate = moment(this.props.locs.startDate);
        const latestDate = moment(this.props.locs.endDate);
        const startDate = earliestDate;
        this.setState({
            // By default, select the first date
            selectedDates: [startDate],
            earliestDate: earliestDate,
            latestDate: latestDate,
            startDate: startDate
        });
    }

    removeAllFeatures() {
        this.state.features.forEach((feature) => {
            feature.setMap(null);
        });
        this.setState({features: []});
    }

    randomDarkColor() {
        var lum = -0.25;
        var hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        var rgb = "#",
            c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }
        return rgb;
    }

    renderMarkers(map, maps) {
        this.removeAllFeatures();

        const datePoints = this.props.locs.datePoints;
        let dayPath = [];
        let bounds = new maps.LatLngBounds();
        let features = [];

        
        let selectedDates = [];
        if (this.state.endDate !== null) {
            debugger;
            var dateRange = Array.from(moment.range(this.state.startDate, this.state.endDate).by('days'));
            dateRange.forEach(function(date, i) {
                selectedDates.push(moment(date.toDate()));
            });
        } else {
            selectedDates.push(this.state.startDate);
        }
        let dateToColorMappings = this.state.dateToColorMappings;

        selectedDates.map((momentDate) => {
            let selDate = momentDate.format("MM/DD/YYYY");
            // Get or update dark color mapping
            let randDarkColor;
            if (selDate in this.state.dateToColorMappings) {
                randDarkColor = this.state.dateToColorMappings[selDate];
            } else {
                randDarkColor = this.randomDarkColor();
                dateToColorMappings[selDate] = randDarkColor;
            }
            datePoints[selDate].map((locEntry) => {
                let coords = {lat: parseFloat(locEntry.lat), lng: parseFloat(locEntry.lon)};
                let marker = new maps.Marker({
                    position: coords,
                    map,
                    title: locEntry.timestamp.toString(),
                    icon: {
                        path: maps.SymbolPath.CIRCLE,
                        fillColor: randDarkColor,
                        fillOpacity: 0.9,
                        strokeColor: randDarkColor,
                        strokeOpacity: 0.9,
                        strokeWeight: 1,
                        scale: 3
                    }
                });
                let window = new maps.InfoWindow({
                    content: moment(locEntry.timestamp).format("MMMM DD hh:mm:ss a")
                });
                marker.addListener('click', function() {
                    window.open(map, marker);
                });
                features.push(marker);
                dayPath.push(coords);
                bounds.extend(marker.position);
                return null;
            });
            let walkingPath = new maps.Polyline({
                path: dayPath,
                geodesic: true,
                strokeColor: randDarkColor,
                strokeOpacity: 1.0,
                strokeWeight: 5
            });
            walkingPath.setMap(map);
            features.push(walkingPath);
            return null;
        });

        this.setState({selectedDates, dateToColorMappings, features});
        map.setCenter(bounds.getCenter());

        maps.event.addListener(map, 'zoom_changed', function() {
            let zoomChangeBoundsListener = 
                maps.event.addListener(map, 'bounds_changed', function(event) {
                    if (this.getZoom() > 17 && this.initialZoom) {
                        // Change max/min zoom here
                        this.setZoom(17);
                        this.initialZoom = false;
                    }
                maps.event.removeListener(zoomChangeBoundsListener);
            });
        });
        map.initialZoom = true;
        map.fitBounds(bounds);
    }

    toDate(str_date) {
        return moment(str_date).toDate();
    }

    onNewDateSelection(date) {
        let momentDate = moment(moment(date).format("MM/DD/YYYY"), "MM/DD/YYYY")
        // date param is date object
        const newRefreshMapCounter = this.state.refreshMapCounter + 1;
        if (this.state.startDate === null) {
            this.setState({
                startDate: momentDate,
                endDate: null,
                refreshMapCounter: newRefreshMapCounter
            })
        } else if (this.state.endDate === null && date >= this.state.startDate) { // startDate != null
            this.setState({
                endDate: momentDate,
                refreshMapCounter: newRefreshMapCounter
            })
        } else { // startDate != null && endDate != null
            // Reset
            this.setState({
                startDate: momentDate,
                endDate: null,
                refreshMapCounter: newRefreshMapCounter
            })
        }
    }

    render() {
        // highlight range contains the first and last date of the range
        let highlightRange = this.state.selectedDates.map(x => x.toDate());
        // console.log(this.state.selectedDates);
        // console.log(this.state.selectedDates.map(x => x.format("MM/DD/YYYY")));
        // console.log(this.state.dateToColorMappings);
        console.log(highlightRange);

        return (
            <div className="google-maps-view">
            <div style={{ height: '100vh', width: '20%', overflow: 'scroll' }}>
                <h5>Date Timeline</h5>
                <p onClick={this.props.onNewFile} style={{textDecoration: "underline", cursor: "pointer"}}>Upload a new file</p>

                {/* TODO higlight the date range, make sure legend iterates through this too */}
                { this.state.earliestDate && this.state.latestDate &&
                    <div>
                        <p>Select a start and end date to see consecutive aggregate location data</p>
                        <DatePicker
                            inline
                            selected={this.state.selectedDates[0].toDate()}
                            minDate={this.state.earliestDate.toDate()}
                            maxDate={this.state.latestDate.toDate()}
                            highlightDates={highlightRange}
                            onSelect={this.onNewDateSelection.bind(this)}
                        />
                    </div>
                }

                <h5>Map Legend</h5>
                <div>
                    {Array.from(new Set(this.state.selectedDates.map(x => x.format("MM/DD/YYYY")))).map((key, _i) => {
                       return(
                        <p key={key.toString()}>
                            <span className="color-block-legend" style={{backgroundColor: this.state.dateToColorMappings[key.toString()]}}></span>
                            {key.toString()}
                        </p>
                       );             
                    })}
                </div>
                
                { this.state.earliestDate && this.state.latestDate &&
                    <div>
                        <h5>Timeline Metadata</h5>
                        <div>
                            <p>Earliest Date: {this.state.earliestDate.format("MM/DD/YYYY")}</p>
                            <p>Latest Date: {this.state.latestDate.format("MM/DD/YYYY")}</p>
                        </div>
                    </div>
                }
            </div>
            <div style={{ height: '100vh', width: '80%' }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
                defaultCenter={this.props.center}
                defaultZoom={5}
                yesIWantToUseGoogleMapApiInternals={true}
                onGoogleApiLoaded={({map, maps}) => this.renderMarkers(map, maps)}
                key={this.state.refreshMapCounter}
              >
              </GoogleMapReact>
            </div>
          </div>
        )
    }
}

GoogleMapsViewer.propTypes = {
    locs: PropTypes.object.isRequired,
    onNewFile: PropTypes.func.isRequired
}

export default GoogleMapsViewer;