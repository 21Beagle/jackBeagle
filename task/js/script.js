	$('#btnRun').click(function() {
		console.log("button clicked", $('#lat').val(), $('#lng').val())
		$.ajax({
			url: "php/oceans.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#lat').val(),
				lng: $('#lng').val()
			},
			
			success: function(result) {
				console.log(JSON.stringify(result));
				console.log(result['data']['name'])
				$('#txtLat').html($('#lat').val())
				$('#txtLng').html($('#lng').val())
				if (result.status.name == "ok") {
					$('#txtLat').html($('#lat').val())
					$('#txtLng').html($('#lng').val())
					$('#txtOcean').html(result['data']['name']);
					console.log(result['data']['name'])

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(JSON.stringify(result));
				$('#txtOcean').html('There is no sea or ocean at this spot');
				$('#txtLat').html($('#lat').val())
				$('#txtLng').html($('#lng').val())
			}
		}); 
	
	});