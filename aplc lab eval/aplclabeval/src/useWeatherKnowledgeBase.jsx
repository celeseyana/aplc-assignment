import React, { useState, useMemo } from 'react';
import weatherData from './data.json'

const useWeatherKnowledgeBase = () => {
  const [data] = useState(weatherData);

  const getDaysWithRainTomorrow = useMemo(() => {
    return data.filter(day => day.RainTomorrow === 'Yes');
  }, [data]);

  const getHotAndWindyDays = useMemo(() => {
    return data.filter(day => day.MaxTemp > 30 && day.WindGustSpeed > 40);
  }, [data]);

  const getDaysWithNoRainTodayButRainTomorrow = useMemo(() => {
    return data.filter(day => day.RainToday === 'No' && day.RainTomorrow === 'Yes');
  }, [data]);

  const getAllData = () => data;

  const getDayById = (id) => {
    return data.find(day => day.id === id);
  };

  const getDaysByDateRange = (startDate, endDate) => {
    return data.filter(day => {
      const dayDate = new Date(day.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return dayDate >= start && dayDate <= end;
    });
  };

  const getSummary = useMemo(() => {
    const totalDays = data.length;
    const rainTomorrowDays = getDaysWithRainTomorrow.length;
    const hotWindyDays = getHotAndWindyDays.length;
    const noRainTodayButRainTomorrowDays = getDaysWithNoRainTodayButRainTomorrow.length;

    return {
      totalDays,
      rainTomorrowDays,
      hotWindyDays,
      noRainTodayButRainTomorrowDays,
      averageMaxTemp: data.reduce((sum, day) => sum + day.MaxTemp, 0) / totalDays,
      averageMinTemp: data.reduce((sum, day) => sum + day.MinTemp, 0) / totalDays,
      averageWindGustSpeed: data.reduce((sum, day) => sum + day.WindGustSpeed, 0) / totalDays
    };
  }, [data, getDaysWithRainTomorrow.length, getHotAndWindyDays.length, getDaysWithNoRainTodayButRainTomorrow.length]);

  const formatResults = (results, title) => {
    return {
      title,
      count: results.length,
      data: results.map(day => ({
        date: day.date,
        minTemp: day.MinTemp,
        maxTemp: day.MaxTemp,
        rainfall: day.Rainfall,
        windGustSpeed: day.WindGustSpeed,
        rainToday: day.RainToday,
        rainTomorrow: day.RainTomorrow
      }))
    };
  };

  return {
    data,
    getDaysWithRainTomorrow,
    getHotAndWindyDays,
    getDaysWithNoRainTodayButRainTomorrow,
    getAllData,
    getDayById,
    getDaysByDateRange,
    getSummary,
    formatResults
  };
};

export default useWeatherKnowledgeBase;