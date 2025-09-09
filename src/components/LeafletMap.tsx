import React from "react";
import { WebView } from "react-native-webview";
import { View } from "react-native";

interface Report {
  id: number;
  title: string;
  content: string;
  address: string;
  latitude: number;
  longitude: number;
  pollutionType: string;
  severityByUser: string;
  status: string;
}

interface SensorStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  waterQualityIndex: number;
}

interface LeafletMapProps {
  reports?: Report[];
  sensors?: SensorStation[];
  showReports?: boolean;
  showSensors?: boolean;
  onReportPress?: (report: Report) => void;
  onSensorPress?: (sensor: SensorStation) => void;
  center?: { latitude: number; longitude: number };
  style?: any;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  reports = [],
  sensors = [],
  showReports = true,
  showSensors = false,
  onReportPress,
  onSensorPress,
  center = { latitude: 14.5995, longitude: 120.9842 },
  style,
}) => {
  const getSeverityColor = (severity: string) => {
    const sev = severity.toLowerCase();
    if (sev.includes("critical")) return "#ef4444";
    if (sev.includes("high")) return "#f97316";
    if (sev.includes("medium")) return "#eab308";
    if (sev.includes("low")) return "#22c55e";
    return "#6b7280";
  };

  const getWQIColor = (wqi: number) => {
    if (wqi >= 80) return "#22c55e";
    if (wqi >= 60) return "#eab308";
    if (wqi >= 40) return "#f97316";
    return "#ef4444";
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WaterBase Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            // Initialize map
            const map = L.map('map').setView([${center.latitude}, ${center.longitude}], 11);
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Custom icon for pollution reports
            const createPollutionIcon = (color) => {
                return L.divIcon({
                    className: 'custom-pollution-marker',
                    html: \`<div style="
                        width: 24px;
                        height: 24px;
                        background-color: \${color};
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 12px;
                    ">💧</div>\`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
            };

            // Custom icon for sensor stations
            const createSensorIcon = (wqi, color) => {
                return L.divIcon({
                    className: 'custom-sensor-marker',
                    html: \`<div style="
                        width: 32px;
                        height: 32px;
                        background-color: \${color};
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 10px;
                        font-weight: bold;
                    ">\${wqi}</div>\`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
            };

            // Add pollution report markers
            ${showReports ? reports.map(report => `
                L.marker([${report.latitude}, ${report.longitude}], {
                    icon: createPollutionIcon('${getSeverityColor(report.severityByUser)}')
                })
                .bindPopup(\`
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0;">\${${JSON.stringify(report.title || "Pollution Report")}}</h4>
                        <p style="margin: 0 0 4px 0; font-size: 12px;">\${${JSON.stringify(report.content)}}</p>
                        <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">📍 \${${JSON.stringify(report.address)}}</p>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                            <div style="width: 12px; height: 12px; background-color: ${getSeverityColor(report.severityByUser)}; border-radius: 50%;"></div>
                            <span style="font-size: 11px;">\${${JSON.stringify(report.severityByUser)}} severity</span>
                        </div>
                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">Type: \${${JSON.stringify(report.pollutionType)}}</p>
                    </div>
                \`)
                .on('click', function() {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'reportPress',
                        data: ${JSON.stringify(report)}
                    }));
                })
                .addTo(map);
            `).join('') : ''}

            // Add sensor station markers
            ${showSensors ? sensors.map(sensor => `
                L.marker([${sensor.latitude}, ${sensor.longitude}], {
                    icon: createSensorIcon(${sensor.waterQualityIndex}, '${getWQIColor(sensor.waterQualityIndex)}')
                })
                .bindPopup(\`
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0;">\${${JSON.stringify(sensor.name)}}</h4>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <div style="width: 16px; height: 16px; background-color: ${getWQIColor(sensor.waterQualityIndex)}; border-radius: 50%;"></div>
                            <span style="font-weight: bold;">WQI: \${${sensor.waterQualityIndex}}</span>
                        </div>
                        <p style="margin: 0; font-size: 11px; color: #666;">Station ID: \${${JSON.stringify(sensor.id)}}</p>
                    </div>
                \`)
                .on('click', function() {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'sensorPress',
                        data: ${JSON.stringify(sensor)}
                    }));
                })
                .addTo(map);
            `).join('') : ''}

            // Handle location updates
            window.updateMapCenter = function(lat, lng) {
                map.setView([lat, lng], map.getZoom());
            };

            // Add user location button
            L.Control.UserLocation = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                    container.style.backgroundColor = 'white';
                    container.style.width = '40px';
                    container.style.height = '40px';
                    container.style.cursor = 'pointer';
                    container.innerHTML = '📍';
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';
                    container.style.justifyContent = 'center';
                    container.style.fontSize = '16px';
                    
                    container.onclick = function() {
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'locationRequest'
                        }));
                    };
                    
                    return container;
                },
                onRemove: function(map) {}
            });

            L.control.userLocation = function(opts) {
                return new L.Control.UserLocation(opts);
            };

            L.control.userLocation({ position: 'topright' }).addTo(map);
        </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'reportPress':
          onReportPress?.(message.data);
          break;
        case 'sensorPress':
          onSensorPress?.(message.data);
          break;
        case 'locationRequest':
          // Handle location request if needed
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={style}>
      <WebView
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
};

export default LeafletMap;
