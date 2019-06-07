import React from 'react';
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

    renderMarkers(map, maps) {
        this.removeAllFeatures();

        const datePoints = this.props.locs.datePoints;
        let dayPath = [];
        let bounds = new maps.LatLngBounds();
        let features = [];
        this.state.selectedDates.map((selDate) => {
            datePoints[selDate].map((locEntry) => {
                let coords = {lat: parseFloat(locEntry.lat), lng: parseFloat(locEntry.lon)};
                let marker = new maps.Marker({
                    position: coords,
                    map,
                    title: locEntry.timestamp.toString()
                });
                features.push(marker);
                dayPath.push(coords);
                bounds.extend(marker.position);
                return null;
            });
            let walkingPath = new maps.Polyline({
                path: dayPath,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
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
            <div style={{ height: '100vh', width: '25%' }}>
              <h5>Date Timeline</h5>
              { this.props.locs && this.props.locs.allDates.map((date) => (
                <li key={date}
                    onClick={this.onToggleSelectedDates}
                    >
                    {date}
                </li> // TODO if selected, mark it differently
              ))}
            </div>
            <div style={{ height: '100vh', width: '75%' }}>
              <GoogleMapReact
                bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
                defaultCenter={this.props.center}
                defaultZoom={5}
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