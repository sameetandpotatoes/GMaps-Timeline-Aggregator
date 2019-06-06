import React from 'react';
import moment from 'moment';
import GoogleMapReact from 'google-map-react';
import PropTypes from 'prop-types';
import './GoogleMapsViewer.css';
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
            refreshMapCounter: 0,
            features: [] 
        }

        this.onToggleSelectedDates = this.onToggleSelectedDates.bind(this)
    }

    componentDidMount() {
        // By default, select the first date
        this.setState({selectedDates: [this.props.locs.allDates[0]]})
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
            let randDarkColor = this.randomDarkColor();
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
                    content: moment(locEntry.timestamp).format("hh:mm:ss a")
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
        console.log(this.state);
    }

    render() {
        return (
            <div className="google-maps-view">
            <div style={{ height: '100vh', width: '20%' }}>
              <h5>Date Timeline</h5>
              <a onClick={this.props.onNewFile} href="#">Upload a new file</a>
              { this.props.locs && this.props.locs.allDates.map((date) => (
                <p key={date}
                    onClick={this.onToggleSelectedDates}
                    className={
                        "date " +
                        (this.state.selectedDates.indexOf(date) >= 0 ? "selected" : "")
                      }
                    >
                    {date}
                </p>
              ))}
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