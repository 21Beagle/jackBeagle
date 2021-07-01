	$('#btnRunOcean').click(function() {
		console.log("button clicked", $('#lat').val(), $('#lng').val())
		$.ajax({
			url: "php/place.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#latWeather').val(),
				lng: $('#lngWeather').val()
			},
			
			success: function(result) {
				console.log(JSON.stringify(result));
				console.log(result['data']['name'])

				if (result.status.name == "ok") {
					$('#txtLatOcean').html($('#latOcean').val())
					$('#txtLngOcean').html($('#lngOcean').val())
					$('#txtOcean').html(result['data']['name']);
					console.log(result['data']['name'])

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$('#txtOcean').html('There is no sea or ocean at this spot');
				$('#txtLatOcean').html($('#latOcean').val())
				$('#txtLngOcean').html($('#lngOcean').val())
			}
		}); 
	
	});