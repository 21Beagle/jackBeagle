	$('#btnRunPlace').click(function() {
		console.log(" place button clicked", $('#latPlace').val(), $('#lngPlace').val())
		$.ajax({
			url: "php/place.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#latPlace').val(),
				lng: $('#lngPlace').val()
			},
			
			success: function(result) {
				JSON.stringify(result)
				data = result['data'][0]
				console.log(data)
				if (result.status.name == "ok") {
					$('#txtLatPlace').html($('#latPlace').val())
					$('#txtLngPlace').html($('#lngPlace').val())
					$('#txtPlace').html(data['name']);
					$('#txtPlaceCountry').html(data['countryName']);
					$('#txtPlaceDescription').html(data['fclName']);
					$('#txtPlaceCont').html(data['continentCode']);

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR)
				console.log(textStatus)
				console.log(errorThrown)
				$('#txtLatPlace').html($('#latPlace').val())
				$('#txtLngPlace').html($('#lngPlace').val())
			}

		}); 
	
	});