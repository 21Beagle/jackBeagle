	$('#btnRunWeather').click(function() {
		console.log("weather button clicked", $('#latWeather').val(), $('#lngWeather').val())
		$.ajax({
			url: "php/weather.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#latWeather').val(),
				lng: $('#lngWeather').val()
			},
			
			success: function(result) {
				console.log(JSON.stringify(result));
				console.log(result)

				if (result.status.name == "ok") {
					$('#txtLatWeather').html($('#latWeather').val())
					$('#txtLngWeather').html($('#lngWeather').val())
					$('#txtWeatherObs').html(result['data']['weatherCondition']);
					$('#txtWeatherClouds').html(result['data']['clouds']);
					$('#txtWeatherTemp').html(result['data']['temperature']);
					$('#txtWeatherStation').html(result['data']['stationName']);
					$('#txtWeatherCountry').html(result['data']['countryCode']);
					console.log(result['data']['name'])

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {

				console.log(jqXHR)
				console.log(textStatus)
				console.log(errorThrown)
				$('#txtLatWeather').html($('#latWeather').val())
				$('#txtLngWeather').html($('#lngWeather').val())
			}
		}); 
	
	});