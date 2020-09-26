let lat = 0;
let lon = 0;
let cityName = ''; 
let countryCode = '';
let temp = 0;
let humidity = 0;
let windSpeed = 0;
let uvIndex = 0;
let iconName = '';
let iconURL= 'https://openweathermap.org/img/wn/';
let weatherIcon = '';
let weatherInfoRequestPrefix = 'https://api.openweathermap.org/data/2.5/';
let fiveDayRequestPrefix = 'https://api.openweathermap.org/data/2.5/forecast?q='; // + &mode=json
let uviQuery = 'uvi?'
// let apiKey = '&appid=994fee8b2531293f358ced41173a8f40'

const apiKey = "&appid=" +key.OW_API_KEY;
let searchHistory = {};

// Preparing page to refresh with search history still intact. 
$(document).ready(() => {
   renderSearchHistory();
})
// Function for freshing page with serach history instact. 
const renderSearchHistory = () => {
  let searchHist = JSON.parse(localStorage.getItem('searchHistory'));
  if(searchHist) {
    arrayLength = searchHist.length;
    for(let i = 0; i < arrayLength; ++i) {
      $(`#row${i}`).html(`<td><button class="recent btn btn-link p-0 text-muted">${searchHist[i].searchString}</button></td>`);
    }
  }
}

$( "table" ).on( "click", "button.recent", function() {
  event.preventDefault();
  getWeatherInformation($(this).text());
});

let initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '[]');
});

$('#city-search').click(() => {
// 'event' is deprecating. Looking into replacement. 
  event.preventDefault();
  let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name, Country").val());
  getWeatherInformation(citySearchString);
})

$('input').keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name, Country").val());
    getWeatherInformation(citySearchString);
  }
})

let getWeatherInformation = (citySearchString => {
  let cityQuery = 'weather?q=' + citySearchString;
  $.ajax({
    url: weatherInfoRequestPrefix + cityQuery + apiKey,
    method: "GET",
    error: (err => {
      alert("Your city was not found. Check your spelling, or enter a city name with a country code, separated by a comma")
      return;
    })
  })
  .then((response) => {
    lat = response.coord.lat;
    lon = response.coord.lon;
    cityName = response.name;
    countryCode = response.sys.country;
    temp = response.main.temp;
    humidity = response.main.humidity;
    windSpeed = response.wind.speed;
    iconName = response.weather[0].icon;
  })
  .then(() => {
    return $.ajax({
      url: weatherInfoRequestPrefix + uviQuery + apiKey + '&lat=' + lat + '&lon=' + lon,
      method: "GET"
    })
    .then(response => {
      uvIndex = response.value;
    })
    .then(() => {
      showValuesOnPage();
    })
  })

  $.ajax({
    url: fiveDayRequestPrefix + citySearchString + apiKey,
    method: "GET"
  })
  .then(response => {
    return setFiveDayData(response);
  })
})

let validatedSearchString = (city => {
  let search = city.split(',');
  if(search.length > 1){
    
    let first = search[0].length;
    let second = search[1].length;
    if(first === 0 || second === 0) {
      return first > second ? search[0] : search[1];
    }
    return search[0] + ',' + search[1];
  } else {
    return city;
  }
})

let dateString = (unixTime => {
  return moment(unixTime).format('MM/DD/YYYY');
})

let showValuesOnPage = (() => {
  let searchString = cityName + ', ' + countryCode;
  $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
  addToSearchHistory(searchString, Date.now());
  renderSearchHistory();
  $('#weatherIcon').attr('src', iconURL + iconName + '.png')
  $('#temp-data').text('Temp: ' + 
    (temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
    ((temp - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
  $('#hum-data').text('Humidity: ' + humidity + '%');
  $('#wind-data').text('Wind: ' + windSpeed + ' MPH');
  $('#uvi-data').text('UV Index: ' + uvIndex);
});

let setFiveDayData = (response => {
  let dataArray = response.list;
  let size = dataArray.length;
  let dayNumber = 1;
  for(let i = 0; i < size; i+=8) {
    $(`#five-day-${dayNumber}`).find('h6').text(dateString(dataArray[i].dt * 1000));
    $(`#five-day-${dayNumber}`).find('.weatherIcon').attr('src', iconURL + dataArray[i].weather[0].icon + '.png');
    $(`#five-day-${dayNumber}`).find('.temp-5').text('Temperature: ' + 
      (dataArray[i].main.temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
      ((dataArray[i].main.temp - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
    $(`#five-day-${dayNumber}`).find('.hum-5').text('Humidity: ' + dataArray[i].main.humidity + '%');
    ++ dayNumber;
  }
})

// TODO: make searchesObj into an array instead of an object
let saveToLocalStorage = (searchHist => {
  return localStorage.setItem('searchHistory', JSON.stringify(searchHist));
});

const addToSearchHistory = (searchString, timeStamp) => {
  let obj = {
    "searchString": searchString,
    "timeStamp": timeStamp
  }
  let searchHist = JSON.parse(localStorage.getItem('searchHistory'));
  if(!searchHist) {
    searchHist = [];
  }

  let len = searchHist.length;
  let inArray = false;
  for(let i = 0; i < len; ++i) {
    if(searchHist[i].searchString === obj.searchString) {
      searchHist[i].timeStamp = obj.timeStamp;
      inArray = true;
    }
  }

  if(inArray === false) {
    searchHist.push(obj);
  }

  searchHist.sort((b, a) => {
    return a.timeStamp - b.timeStamp;
  });

  while(searchHist.length > 10) {
    let popResult = searchHist.pop();
  }

  saveToLocalStorage(searchHist);
}




// var queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=Washington,US&appid=994fee8b2531293f358ced41173a8f40";

// $.ajax({
//   url: queryURL,
//   method: "GET"
// }).then(function(response) {
//   console.log(response);
// });


