	$('#btnRunOcean').click(function() {
		console.log("Ocean button clicked", $('#latOcean').val(), $('#lngOcean').val())
		$.ajax({
			url: "php/oceans.php",
			type: 'POST',
			dataType: 'json',
			data: {
				lat: $('#latOcean').val(),
				lng: $('#lngOcean').val()
			},
			
			success: function(result) {
				console.log(JSON.stringify(result));
				console.log(result.data)
				data = result.data 
				console.log(data)
				if (result.status.name == "ok") {
					$('#txtLatOcean').html($('#latOcean').val())
					$('#txtLngOcean').html($('#lngOcean').val())
					$('#txtOcean').html(data['name']);
					console.log(data['name'])

				}
			
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(jqXHR)
				console.log(textStatus)

				console.log(errorThrown)
				$('#txtOcean').html('There is no sea or ocean at this spot');
				$('#txtLatOcean').html($('#latOcean').val())
				$('#txtLngOcean').html($('#lngOcean').val())
			}
		}); 
	
	});