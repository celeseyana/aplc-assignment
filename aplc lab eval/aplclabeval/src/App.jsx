import React, { useState, useMemo } from 'react';
import useWeatherKnowledgeBase from './useWeatherKnowledgeBase';

const WeatherAnalysisApp = () => {
  const {
    data,
    getDaysWithRainTomorrow,
    getHotAndWindyDays,
    getDaysWithNoRainTodayButRainTomorrow,
    getAllData,
    getSummary,
    formatResults
  } = useWeatherKnowledgeBase();

  const [activeTab, setActiveTab] = useState('display');
  const [filters, setFilters] = useState({
    windDirection: '',
    windDirectionField: 'WindGustDir',
    extremeWeather: false,
    hotDry: false,
    sortBy: 'MaxTemp',
    maxTempThreshold: '',
    rainfallThreshold: '',
    humidityThreshold: ''
  });
  
  const tempComparison = (threshold) => (record) => record.MaxTemp > threshold;
  
  const windComparison = (threshold) => (record) => record.WindGustSpeed > threshold;
  
  const createComplexFilter = (tempThreshold, windThreshold) => (record) => 
    tempComparison(tempThreshold)(record) || windComparison(windThreshold)(record);
    
  const isHotAndDry = (record) => record.MaxTemp > 35 && record.Humidity3pm < 30;
  const hasRainToday = (record) => record.RainToday === 'Yes';
  const hasRainTomorrow = (record) => record.RainTomorrow === 'Yes';
  const noRainTodayButTomorrow = (record) => record.RainToday === 'No' && record.RainTomorrow === 'Yes';
  const extremeConditions = (record) => record.MaxTemp > 30 && record.WindGustSpeed > 40;
  
  const windDirectionFilter = (direction, field) => (record) =>
    direction === '' || record[field] === direction;

  const getUniqueWindDirections = (data, field) => {
    const directions = [...new Set(data.map(record => record[field]).filter(dir => dir && dir !== ''))];
    return directions.sort();
  };

  const availableWindDirections = useMemo(() => {
    return getUniqueWindDirections(data, filters.windDirectionField);
  }, [data, filters.windDirectionField]);

  const enhancedData = useMemo(() => {
    return data.map(record => ({
      ...record,
      DailyRange: record.MaxTemp - record.MinTemp,
      IsHotDry: isHotAndDry(record),
      IsExtreme: extremeConditions(record)
    }));
  }, [data]);

  const rainyDaysCount = useMemo(() => {
    return enhancedData.filter(hasRainToday).length;
  }, [enhancedData]);

  const searchResults = useMemo(() => {
    return {
      highTempDays: enhancedData.filter(tempComparison(35)),
      highWindDays: enhancedData.filter(windComparison(40)),
      combinedResults: enhancedData.filter(createComplexFilter(35, 40))
    };
  }, [enhancedData]);

  const filteredData = useMemo(() => {
    let filteredRecords = [...enhancedData];
    
    if (filters.windDirection) {
      filteredRecords = filteredRecords.filter(
        windDirectionFilter(filters.windDirection, filters.windDirectionField)
      );
    }

    if (filters.extremeWeather) {
      filteredRecords = filteredRecords.filter(createComplexFilter(35, 40));
    }
    
    if (filters.hotDry) {
      filteredRecords = filteredRecords.filter(isHotAndDry);
    }
    
    return filteredRecords;
  }, [enhancedData, filters]);

  const sortedData = useMemo(() => {
    const key = filters.sortBy;
    return [...filteredData].sort((a, b) => b[key] - a[key]);
  }, [filteredData, filters.sortBy]);


  const WeatherCard = ({ record }) => (
    <div className="box mb-5">
      <div className="level">
        <div className="level-right">
          <div className="level-item">
            <div className="tags">
              {record.IsHotDry && <span className="tag is-danger">Hot & Dry</span>}
              {record.IsExtreme && <span className="tag is-warning">Extreme</span>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="columns">
        <div className="column">
          <div className="media">
            <div className="media-left">
              <span className="icon is-large has-text-danger">
                <i className="fas fa-thermometer-half" style={{fontSize: '2rem'}}>🌡️</i>
              </span>
            </div>
            <div className="media-content">
              <p className="heading">Min/Max Temp</p>
              <p className="title is-6">{record.MinTemp}°C / {record.MaxTemp}°C</p>
              <p className="subtitle is-7">Range: {record.DailyRange.toFixed(1)}°C</p>
            </div>
          </div>
        </div>
        
        <div className="column">
          <div className="media">
            <div className="media-left">
              <span className="icon is-large has-text-info">
                <i className="fas fa-tint" style={{fontSize: '2rem'}}>💧</i>
              </span>
            </div>
            <div className="media-content">
              <p className="heading">Rainfall</p>
              <p className="title is-6">{record.Rainfall}mm</p>
              <p className="subtitle is-7">Today: {record.RainToday}</p>
            </div>
          </div>
        </div>
        
        <div className="column">
          <div className="media">
            <div className="media-left">
              <span className="icon is-large has-text-success">
                <i className="fas fa-wind" style={{fontSize: '2rem'}}>💨</i>
              </span>
            </div>
            <div className="media-content">
              <p className="heading">Wind Gust Speed</p>
              <p className="title is-6">{record.WindGustSpeed} km/h</p>
              <p className="subtitle is-7">{record.WindGustDir}</p>
            </div>
          </div>
        </div>
        
        <div className="column">
          <div className="media">
            <div className="media-left">
              <span className="icon is-large has-text-grey">
                <i className="fas fa-cloud" style={{fontSize: '2rem'}}>☁️</i>
              </span>
            </div>
            <div className="media-content">
              <p className="heading">Humidity 3pm</p>
              <p className="title is-6">{record.Humidity3pm}%</p>
              <p className="subtitle is-7">Rain Tomorrow: {record.RainTomorrow}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <div className="box has-text-centered">
      <div className="icon-text">
        <span className={`icon is-large has-text-${color}`}>
          <i style={{fontSize: '2rem'}}>{icon}</i>
        </span>
      </div>
      <p className="heading">{title}</p>
      <p className="title is-3">{value}</p>
    </div>
  );

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css" />
      
      <div className="hero is-info is-small">
        <div className="hero-body">
          <div className="container has-text-centered">
            <h1 className="title is-2">Weather Analysis Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <div className="tabs is-centered is-boxed is-large mb-5">
          <ul>
            {['display', 'search', 'knowledge', 'stats'].map((tab) => (
              <li key={tab} className={activeTab === tab ? 'is-active' : ''}>
                <a onClick={() => setActiveTab(tab)}>
                  <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="box mb-5">
          <h3 className="title is-5">
            <span className="icon-text">
              <span className="icon">🔍</span>
              <span>Filters & Advanced Queries</span>
            </span>
          </h3>
          <div className="columns">
            <div className="column">
              <div className="field">
                <label className="label">Wind Direction Filter</label>
                <div className="field mt-4">
                  <label className="label">Sort By</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                      >
                        <option value="MaxTemp">Max Temperature</option>
                        <option value="Rainfall">Rainfall</option>
                        <option value="Humidity3pm">Humidity 3pm</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field has-addons">
                  <p className="control is-expanded">
                    <span className="select is-fullwidth">
                      <select
                        value={filters.windDirectionField}
                        onChange={(e) => setFilters({...filters, windDirectionField: e.target.value, windDirection: ''})}
                      >
                        <option value="WindGustDir">Wind Gust Dir</option>
                        <option value="WindDir9am">Wind Dir 9am</option>
                        <option value="WindDir3pm">Wind Dir 3pm</option>
                      </select>
                    </span>
                  </p>
                  <p className="control is-expanded">
                    <span className="select is-fullwidth">
                      <select
                        value={filters.windDirection}
                        onChange={(e) => setFilters({...filters, windDirection: e.target.value})}
                      >
                        <option value="">All Directions</option>
                        {availableWindDirections.map(direction => (
                          <option key={direction} value={direction}>
                            {direction}
                          </option>
                        ))}
                      </select>
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={filters.extremeWeather}
                      onChange={(e) => setFilters({...filters, extremeWeather: e.target.checked})}
                    />
                    &nbsp;Extreme Weather (MaxTemp {'>'} 35°C OR WindGust {'>'} 40 km/h)
                  </label>
                </div>
              </div>
            </div>
            
            <div className="column">
              <div className="field">
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={filters.hotDry}
                      onChange={(e) => setFilters({...filters, hotDry: e.target.checked})}
                    />
                    &nbsp;Hot & Dry Days (MaxTemp {'>'} 35°C AND Humidity {'<'} 30%)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'display' && (
          <div>
            <h2 className="title is-3">Weather Records Display</h2>
            <div className="notification is-info is-light">
              Showing {sortedData.length} records sorted by MaxTemp, Rainfall, and Humidity3pm (descending)
            </div>
            {sortedData.map(record => (
              <WeatherCard key={record.id} record={record} />
            ))}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <h2 className="title is-3">Search Results</h2>
            
            <div className="columns">
              <div className="column">
                <div className="box">
                  <h3 className="title is-5 has-text-warning">High Temperature Days ({'>'} 35°C)</h3>
                  {searchResults.highTempDays.length === 0 ? (
                    <p className="has-text-grey">No high temperature days found</p>
                  ) : (
                    searchResults.highTempDays.map(record => (
                      <div key={record.id} className="level">
                        <div className="level-right">
                          <div className="level-item">
                            <span className="tag is-warning">{record.MaxTemp}°C</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="column">
                <div className="box">
                  <h3 className="title is-5 has-text-success">High Wind Days ({'>'} 40 km/h)</h3>
                  {searchResults.highWindDays.length === 0 ? (
                    <p className="has-text-grey">No high wind days found</p>
                  ) : (
                    searchResults.highWindDays.map(record => (
                      <div key={record.id} className="level">
                        <div className="level-right">
                          <div className="level-item">
                            <span className="tag is-success">{record.WindGustSpeed} km/h</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="box">
              <h3 className="title is-5 has-text-info">Combined Search (MaxTemp {'>'} 35°C OR WindGust {'>'} 40 km/h)</h3>
              {searchResults.combinedResults.length === 0 ? (
                <p className="has-text-grey">No extreme weather days found</p>
              ) : (
                searchResults.combinedResults.map(record => (
                  <div key={record.id} className="level">
                    <div className="level-right">
                      <div className="level-item">
                        <span className="tag is-info">{record.MaxTemp}°C, {record.WindGustSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div>
            <h2 className="title is-3">Knowledge Base Queries</h2>
            
            <div className="columns is-multiline">
              <div className="column is-half">
                <div className="box">
                  <h3 className="title is-5 has-text-info">Days with Rain Tomorrow</h3>
                  <p className="subtitle is-6">RainTomorrow == 'Yes'</p>
                  {getDaysWithRainTomorrow.map(record => (
                    <div key={record.id} className="level">
                      <div className="level-right">
                        <div className="level-item">
                          <span className="tag is-info">Rain Expected</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="column is-half">
                <div className="box">
                  <h3 className="title is-5 has-text-danger">Hot & Windy Days</h3>
                  <p className="subtitle is-6">MaxTemp {'>'} 30°C AND WindGustSpeed {'>'} 40 km/h</p>
                  {getHotAndWindyDays.length === 0 ? (
                    <p className="has-text-grey">No hot & windy days found</p>
                  ) : (
                    getHotAndWindyDays.map(record => (
                      <div key={record.id} className="level">
                        <div className="level-right">
                          <div className="level-item">
                            <span className="tag is-danger">{record.MaxTemp}°C, {record.WindGustSpeed} km/h</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="column is-half">
                <div className="box">
                  <h3 className="title is-5 has-text-primary">Surprise Rain Days</h3>
                  <p className="subtitle is-6">RainToday == 'No' but RainTomorrow == 'Yes'</p>
                  {getDaysWithNoRainTodayButRainTomorrow.map(record => (
                    <div key={record.id} className="level">
                      <div className="level-right">
                        <div className="level-item">
                          <span className="tag is-primary">Surprise Rain</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="column is-half">
                <div className="box">
                  <h3 className="title is-5 has-text-warning">Hot & Dry Days</h3>
                  <p className="subtitle is-6">MaxTemp {'>'} 35°C AND Humidity3pm {'<'} 30%</p>
                  {enhancedData.filter(isHotAndDry).length === 0 ? (
                    <p className="has-text-grey">No hot & dry days found</p>
                  ) : (
                    enhancedData.filter(isHotAndDry).map(record => (
                      <div key={record.id} className="level">
                        <div className="level-right">
                          <div className="level-item">
                            <span className="tag is-warning">{record.MaxTemp}°C, {record.Humidity3pm}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="title is-3">Statistics & Summary</h2>
            
            <div className="columns">
              <div className="column">
                <StatCard
                  title="Total Records"
                  value={getSummary.totalDays}
                  icon="📊"
                  color="info"
                />
              </div>
              <div className="column">
                <StatCard
                  title="Rainy Days Today"
                  value={rainyDaysCount}
                  icon="🌧️"
                  color="info"
                />
              </div>
              <div className="column">
                <StatCard
                  title="Rain Tomorrow Days"
                  value={getSummary.rainTomorrowDays}
                  icon="☔"
                  color="primary"
                />
              </div>
              <div className="column">
                <StatCard
                  title="Hot & Windy Days"
                  value={getSummary.hotWindyDays}
                  icon="⚠️"
                  color="danger"
                />
              </div>
            </div>

            <div className="box">
              <h3 className="title is-5">Knowledge Base Summary</h3>
              <div className="content">
                <div className="columns">
                  <div className="column">
                    <h4 className="subtitle is-6">Weather Averages</h4>
                    <p><strong>Average Max Temperature:</strong> {getSummary.averageMaxTemp.toFixed(1)}°C</p>
                    <p><strong>Average Min Temperature:</strong> {getSummary.averageMinTemp.toFixed(1)}°C</p>
                    <p><strong>Average Wind Gust Speed:</strong> {getSummary.averageWindGustSpeed.toFixed(1)} km/h</p>
                  </div>
                  <div className="column">
                    <h4 className="subtitle is-6">Functional Programming Results</h4>
                    <p><strong>Days with Rain Today:</strong> {rainyDaysCount} (using hasRainToday lambda)</p>
                    <p><strong>High Temp Days ({'>'} 35°C):</strong> {searchResults.highTempDays.length} (using curried tempComparison)</p>
                    <p><strong>High Wind Days ({'>'} 40 km/h):</strong> {searchResults.highWindDays.length} (using curried windComparison)</p>
                    <p><strong>Hot & Dry Days:</strong> {enhancedData.filter(isHotAndDry).length} (using lambda expression)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="box">
              <h3 className="title is-5">Daily Range Analysis</h3>
              <div className="content">
                <p>All records have been mapped with a calculated DailyRange field (MaxTemp - MinTemp):</p>
                <div className="table-container">
                  <table className="table is-striped is-fullwidth">
                    <thead>
                      <tr>
                        <th>Min Temp</th>
                        <th>Max Temp</th>
                        <th>Daily Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedData.map(record => (
                        <tr key={record.id}>
                          <td>{record.MinTemp}°C</td>
                          <td>{record.MaxTemp}°C</td>
                          <td><strong>{record.DailyRange.toFixed(1)}°C</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WeatherAnalysisApp;