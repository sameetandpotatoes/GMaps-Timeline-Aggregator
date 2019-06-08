import React from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import GoogleMapReact from 'google-map-react';
import PropTypes from 'prop-types';

import './GoogleMapsViewer.css';
import "react-datepicker/dist/react-datepicker.css";

import { GOOGLE_MAPS_API_KEY } from './keys.js';

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
            startDate: null,
            endDate: null 
        }

        this.onToggleSelectedDates = this.onToggleSelectedDates.bind(this)
    }

    componentDidMount() {
        // By default, select the first date
        const startDate = this.props.locs.allDates[0];
        const endDate = this.props.locs.allDates[this.props.locs.allDates.length - 1];
        this.setState({
            selectedDates: [startDate, endDate],
            startDate: moment(startDate),
            endDate: moment(endDate)
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
        this.state.selectedDates.map((selDate) => {
            let randDarkColor;
            if (selDate in this.state.dateToColorMappings) {
                randDarkColor = this.state.dateToColorMappings[selDate];
            } else {
                randDarkColor = this.randomDarkColor();
                this.state.dateToColorMappings[selDate] = randDarkColor;
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

        this.setState({features});
        map.setCenter(bounds.getCenter());

        maps.event.addListener(map, 'zoom_changed', function() {
            let zoomChangeBoundsListener = 
                maps.event.addListener(map, 'bounds_changed', function(event) {
                    if (this.getZoom() > 17 && this.initialZoom == true) {
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

    onToggleSelectedDates(e) {
        let dateStr = e.target.textContent;
        if (this.state.selectedDates.indexOf(dateStr) >= 0) {
            this.state.selectedDates.splice(this.state.selectedDates.indexOf(dateStr), 1);
        } else {
            this.state.selectedDates.push(dateStr);
        }
        this.setState({refreshMapCounter: this.state.refreshMapCounter + 1});
    }

    toDate(str_date) {
        return moment(str_date).toDate();
    }

    onNewDateSelection(date) {
        // date object
        let momentDate = moment(date);

        if (this.state.startDate === null) {
            this.setState({
                startDate: momentDate,
                endDate: null
            })
        } else if (this.state.endDate === null && momentDate >= this.state.startDate) { // startDate != null
            this.setState({
                endDate: momentDate
            })
        } else { // startDate != null && endDate != null
            // Reset
            this.setState({
                startDate: momentDate,
                endDate: null
            })
        }
    }

    render() {
        return (
            <div className="google-maps-view">
            <div style={{ height: '100vh', width: '20%' }}>
                <h5>Date Timeline</h5>
                <a onClick={this.props.onNewFile} href="#">Upload a new file</a>

                <p>Select a start and end date to see consecutive aggregate location data</p>
                <DatePicker
                    inline
                    selected={moment(this.state.selectedDates[0]).toDate()}
                    minDate={(this.state.startDate && this.state.startDate.toDate()) || new Date()}
                    maxDate={(this.state.endDate && this.state.endDate.toDate()) || new Date()}
                    onSelect={this.onNewDateSelection}
                />

                <h5>Map Legend</h5>
                <div>
                    {this.state.selectedDates.map((key, i) => {
                       return (
                        <p>
                            <div className="color-block-legend" style={{"background-color": this.state.dateToColorMappings[key]}}></div>
                            {key.toString()}
                        </p>
                       );             
                    })}
                </div>
                
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