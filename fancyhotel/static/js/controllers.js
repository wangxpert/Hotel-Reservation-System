var resourceModule = angular.module('resourceModule', ['ngResource']);

resourceModule.factory('authFactory', function($resource){
	return $resource('/api', {}, {
		Register: {
			method: 'POST',
			url: '/api/register'
		},
		Login: {
			method: 'POST',
			url: '/api/login'
		}

	})
})

resourceModule.factory('reportFactory', function($resource){
	return $resource('/api', {}, {
			ResReport: {
				method: 'GET',
				url: '/api/reports/reservation'
			},
			PopularRoomCatReport: {
				method: 'GET',
				url: '/api/reports/popularRoom'
			},
			RevenueReport: {
				method: 'GET',
				url: '/api/reports/revenue'
			}
	})
})

resourceModule.factory('reservationFactory', function($resource){
	return $resource('/api', {}, {
		SearchRooms:{
			method: 'GET',
			url: '/api/searchRoom'
		},
		GetReservation:{
			method:'GET',
			url: '/api/reservation/:reservation_id'
		},
		MakeReservation: {
			method: 'POST',
			url: '/api/reservation/create'	
		},
		UpdateReservationConfirm:{
			method: 'GET',
			url: '/api/reservation/:reservation_id/availability'
		},
		UpdateReservation:{
			method:'PUT',
			url: '/api/reservation/:reservation_id'
		},
		CancelReservation:{
			method:'GET',
			url: '/api/reservation/:reservation_id/cancel'
		}
	})
})

resourceModule.factory('reviewFactory', function($resource){
	return $resource('/api', {}, {
		AddReview:{
			method: 'POST',
			url: '/api/review'
		},
		GetReviews:{
			method: 'GET',
			url: '/api/review',
			isArray: true
		}
	})
})

resourceModule.factory('paymentFactory', function($resource){
	return $resource('/api', {}, {
		GetCreditCards:{
			method: 'GET',
			url: '/api/payment',
			isArray: true
		},
		AddCreditCard:{
			method: 'POST',
			url: '/api/payment'
		},
		DeleteCreditCard:{
			method: 'DELETE',
			url: '/api/payment'
		},
		GetReservationByCardNumber:{
			method: 'GET',
			url:'/api/reservation/cardNumber',
			isArray: true //returns an array
		}
	})
})




angular.module('FancyHotelApp', ['ngRoute', 'ngResource', 'resourceModule'])

.run(function($rootScope) {
    $rootScope.currentUser = '';
	$rootScope.userType = '';
	$rootScope.alreadyLoggedIn = function(){
		if($rootScope.currentUser != ''){
			console.log("you're already logged in.")
			return true;
		}
		console.log("you're not logged in yet.")
		return false;
	}

	$rootScope.getUserType = function(){
		var userType = $rootScope.currentUser.charAt(0);
		if(userType == 'M' || userType == 'm' ){
			$rootScope.userType = "manager";
		}
		else if(userType == 'C' || userType == 'c'){
			$rootScope.userType = "customer";
		}
		else{
			$rootScope.userType = "invalid user type";
		}
	}

	$rootScope.isRequired = true;

})


.controller('registerController', function($rootScope, $scope, authFactory, $window) {
	$rootScope.alreadyLoggedIn();
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();
	$scope.confirmPass;
	var usernameFail = false;
	$scope.username = '';
	$scope.myRegex = /C[a-zA-Z0-9]{4}/;

	$scope.submit = function() {
		if($scope.confirmPass !== $scope.password){
			window.alert("Please check your password. There were inconsistencies when you tried to confirm it.");
			console.log("Your passwords don't match.");
			return;
		}
		if($scope.username == undefined || $scope.username.length!=5){
			window.alert("Usernames must be a C followed by 4 characters.");
			console.log("Username wasn't 5 characters");
			return;
		}

		response = authFactory.Register({
			"username": $scope.username,
			"email": $scope.email,
			"password": $scope.password,
			"firstName": $scope.firstName,
			"lastName": $scope.lastName
		}
		, function(successData)
		{
			console.log("account created, being redirected to login screen for official login.");
			$window.location.href='#/login';
		},
		function(errorData)
		{
			console.log("This username is already taken. Please select another.");
			window.alert("This username is already taken. Please select another.");
		});
	}
	
})

.controller('loginController', function($rootScope, $scope, authFactory, $window){
	$rootScope.alreadyLoggedIn();
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();

	$scope.submit = function(){
		response = authFactory.Login({
			"username": $scope.username,
			"password": $scope.password
		},
		function(successData){
			$rootScope.currentUser = $scope.username;
			$rootScope.getUserType();
			console.log("login success!");
			console.log("redirecting...");
			$window.location.href='#/portal';
		},
		function(errorData)
		{
			console.log("login failed");
			window.alert("Invalid credentials");
		});
	}

})

.controller('portalController', function($rootScope, $scope){
	$rootScope.alreadyLoggedIn();
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();
	$rootScope.currentUser;
	$rootScope.getUserType();
	$rootScope.userType;


})
.controller('reservationController', function($rootScope, $scope, $window, reservationFactory, paymentFactory){
	$scope.creditCards; //the number for USING a card
	$scope.creditCardNumber; //the number for ADDING a card
	$scope.cardToDelete; //card you're trying to delete

	var now = new Date();
	var nowplustwo = new Date();
	var nowplusone = new Date();
	nowplusone.setDate(now.getDate()+ 1);
	nowplustwo.setDate(now.getDate() + 2);
	$("#startDatePicker").datetimepicker(
		{
			format: 'YYYY-MM-DD',
			minDate: now,
			date: now
		}
	);
	$("#endDatePicker").datetimepicker(
		{
			format: 'YYYY-MM-DD',
			minDate: nowplusone,
			date: nowplustwo
		}
	);
	
	$('#startDatePicker').on("dp.change", function (e) {
		console.log(e);
		$('#endDatePicker').data("DateTimePicker").minDate(e.date);
	});

	$('#endDatePicker').on("dp.change", function (e) {
		$('#startDatePicker').data("DateTimePicker").maxDate(e.date);
	});
	
	$("#newStartDate").datetimepicker(
		{
			format: 'YYYY-MM-DD',
			minDate: new Date()
		}
	);
	$("#newEndDate").datetimepicker(
		{
			format: 'YYYY-MM-DD',
		}
	);
	
	$('#newStartDate').on("dp.change", function (e) {
		console.log(e);
		$('#newEndDate').data("DateTimePicker").minDate(e.date);
	});

	$('#newEndDate').on("dp.change", function (e) {
		$('#newStartDate').data("DateTimePicker").maxDate(e.date);
	});
					
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();
	$scope.viewPart1 = true; //these views are for the update page
	$scope.viewPart2 = false;
	$scope.viewPart3 = false;
	$scope.confirmationPage = false;
	$scope.currRes =''; //this is for the update page
	$scope.newCost = 0;
	$scope.total_cost = 0;
	$scope.cancelView1=true;
	$scope.cancelView2=false;

	$scope.availability={ //this is availability of rooms for an update reservation
		"avail": '',
		"message": ''
	};
	$scope.roomsAvailable = []; //this is rooms available for a new search on rooms, not an upate
	$scope.error = '';
	$scope.hideForm = false;
	$scope.selectedRooms = {};
	$scope.extra_beds = {};
	$scope.location="Atlanta";


	$scope.creditCards = '';
	//api/blah/blah?username=Csara
	$scope.submit = function(){
		$scope.checkIn = $("#startDatePicker").data("date");
        $scope.checkOut = $("#endDatePicker").data("date");
		
		searchRoomsResponse = reservationFactory.SearchRooms(
		{
			"location": $scope.location,
			"checkIn": $scope.checkIn,
			"checkOut": $scope.checkOut
		});
	//handle promise
		searchRoomsResponse.$promise.then(function(data){
			if(data["result"] == true){
				$scope.roomsAvailable = data["response"];
				$scope.hideForm = true; //hides the form and replaces it with the available rooms
			}
			else{
				$scope.error="Sorry, there are no available rooms for this period of time.";
			}

			getCardsResponse = paymentFactory.GetCreditCards({
				"username": $rootScope.currentUser
			});
			getCardsResponse.$promise.then(function(data){
				$scope.creditCards = data; //data is an array
				if($scope.creditCards.length!=0){
					$scope.cardNumber = $scope.creditCards[0].card_number;
				}
			});
		});
	};
	
	$scope.updateTotalCost = function()
	{
		$scope.total_cost = 0;
		var check_in_raw = $("#startDatePicker").data("DateTimePicker").date();
		var check_out_raw = $("#endDatePicker").data("DateTimePicker").date();
		var check_in = moment([check_in_raw.year(), check_in_raw.month(), check_in_raw.date()]);
        var check_out = moment([check_out_raw.year(), check_out_raw.month(), check_out_raw.date()]);
		var delta = Math.round(moment.duration(check_out.diff(check_in)).asDays());
		for(var key in $scope.selectedRooms)
		{
			if($scope.selectedRooms[key])
			{
				$scope.roomsAvailable.forEach(
					function(room)
					{
						if(room.location + room.room_number === key)
						{
							$scope.total_cost += room.cost;
							if((room.location + room.room_number) in $scope.extra_beds && $scope.extra_beds[room.location + room.room_number])
							{
								$scope.total_cost += room.extra_bed_price;
							}
						}	
					}
				);
			}
		}
		$scope.total_cost *= (delta);
	};
		
	
	$scope.bookRooms = function(){
		if($scope.creditCards=='' || $scope.creditCards.length==0){
			console.log("credit card info required");
			window.alert("Please select a credit card for payment. If you have no credit card, please add one first.");
		}
		var cardExpireDate;
		var currentCard = $scope.cardNumber;
		console.log("Current card number is :");
		console.log(currentCard);
		for(i=0; i<$scope.creditCards.length; i++){
			if($scope.creditCards[i].card_number==$scope.cardNumber){
				cardExpireDate = $scope.creditCards[i].expiration_date;
				console.log("Found the card number, it is:");
				console.log($scope.creditCards[i].card_number);
				break;
			}
		}
		if(cardExpireDate<$scope.checkOut){
			console.log("The card's expiration date is sooner than the checkout date");
			window.alert("You can't use this card because it expires before your stay is done.");
			console.log("Reservation failed");
			return;
		}
		var rooms = []
		for(var key in $scope.selectedRooms)
		{
			if($scope.selectedRooms[key])
			{
				$scope.roomsAvailable.forEach(
					function(room)
					{
						if(room.location + room.room_number === key)
						{
							if((room.location + room.room_number) in $scope.extra_beds && $scope.extra_beds[room.location + room.room_number])
							{
								rooms.push({
									"room_number": room.room_number,
									"location": room.location,
									"cost": room.cost,
									"extra_bed_price": room.extra_bed_price,
									"extra_bed_or_not": 1
								});
							}
							else
							{
								rooms.push({
									"room_number": room.room_number,
									"location": room.location,
									"cost": room.cost,
									"extra_bed_price": room.extra_bed_price,
									"extra_bed_or_not": 0	
							
								});
							}
						}	
					}
				);
			}
		}
		
		//rooms
		console.log(rooms);
		if(rooms.length==0){
			window.alert("You must select some room(s) in order to make a reservation.");
			console.log("no rooms selected");
		}

		var make_response = reservationFactory.MakeReservation(
			{
				"username": $rootScope.currentUser,
				"checkIn": $scope.checkIn,
				"checkOut": $scope.checkOut,
				"card_number": $scope.cardNumber, //need to fill in with card info
				"rooms": rooms
			}
		);
		make_response.$promise.then(function(data)
		{
			console.log(data);
			$scope.confirmationData = data;
			$scope.confirmationPage = true;
		});
	}

	$scope.findReservation = function(){
		getReservationResponse = reservationFactory.GetReservation({
			"reservation_id": $scope.resID,
			"username": $rootScope.currentUser
		});
	//handle promise
		getReservationResponse.$promise.then(function(data){
			if(data["result"] == true){
				$scope.cancelView1=false;
				$scope.cancelView2=true;
				$scope.viewPart2 = true;
				$scope.viewPart1 = false;
				$scope.currRes = data["data"];

				$scope.refund_amount = $scope.refundAmount($scope.currRes.checkin_date, $scope.currRes.total_cost);
				$scope.cancel_cost = $scope.currRes.total_cost - $scope.refund_amount;
			}
			else{
				console.log("The reservation cannot be found. It may not exist, or you may not own it, or it may have been cancelled already.");
				//something about how the reservation doesn't exist
			}
		});
	};


	$scope.searchAvailability = function(){
		$scope.newCheckinDate = $("#newStartDate").data("date");
		$scope.newCheckoutDate = $("#newEndDate").data("date"); 
		var checkin_date_raw = $("#newStartDate").data("DateTimePicker").date();
		var checkout_date_raw = $("#newEndDate").data("DateTimePicker").date();
		var newCheckinDate = moment([checkin_date_raw.year(), checkin_date_raw.month(), checkin_date_raw.date()]);
		var newCheckoutDate = moment([checkout_date_raw.year(), checkout_date_raw.month(), checkout_date_raw.date()]);
		var delta = moment.duration(newCheckoutDate.diff(newCheckinDate)).asDays();
		updateReservationConfirmResponse = reservationFactory.UpdateReservationConfirm({
			"reservation_id": $scope.resID,
			"checkIn": $scope.newCheckinDate,
			"checkOut": $scope.newCheckoutDate,
			"username":$rootScope.currentUser
		},
		function(successData)
		{
			$scope.viewPart3 = true;
			$scope.availability["message"] = "Your selected rooms are available for your newly selected dates. Would you like to confirm your updated reservation?"
			$scope.availability["avail"] = true;
			$scope.newCost = $scope.calculateNewCost(delta, successData.data['rooms']);
		},
		function(errorData)
		{
			window.alert("Sorry, but your selected rooms are not available for your newly selected dates.");
		});

	};

	$scope.calculateNewCost = function(time_delta, rooms)
	{
		var total_cost = 0;
		rooms.forEach(function(room)
		{
			total_cost += room.cost;
			total_cost += room.extra_bed_or_not == "1" ? room.extra_bed_price : 0
		});
		return total_cost *= time_delta;
	}

	$scope.updateReservation = function(){
		updateReservationResponse = reservationFactory.UpdateReservation(
		{
			"username":$rootScope.currentUser,
			"reservation_id": $scope.resID,
			"checkIn": $("#newStartDate").data("date"),
			"checkOut": $("#newEndDate").data("date")
		});
		//handle promise
		updateReservationResponse.$promise.then(function(data){
			$window.location.href = "#/portal";
		});
	};

	$scope.cancelReservation = function(){
		cancelReservationResponse = reservationFactory.CancelReservation({
			"reservation_id": $scope.resID,
			"username":$rootScope.currentUser
		});

		//also pass in the new cost we give it
	//handle promise
		cancelReservationResponse.$promise.then(function(data){
			if(data["result"]==true){
			console.log("Successfully cancelled reservation.");
			}
			else{
				console.log("This reservation cannot be deleted.")

			}
		});
	};

	$scope.today = new Date();
	$scope.refundAmount = function(checkinDate, theCost){
		var nowDate = moment();
		var checkinDateMoment = moment(checkinDate);
		var delta = Math.round(moment.duration(checkinDateMoment - nowDate).asDays())
		var refund = 0;
		if(delta <= 1){
			refund = 0;
		}
		else if(delta<4){
			refund =theCost*0.8
		}
		else{
			refund = theCost;
		}
		return refund;
	}


})


.controller('reportController', function($rootScope, $scope, reportFactory){
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();
	$scope.creditCards;
	$scope.resReport;
	$scope.popCatReport = {};
	$scope.revenueReport = {};
	$scope.emptyTable = "";

	$scope.getMonth = function(month){
		if(month==="8"){
			return "August";
		}
		else if(month==="9"){
			return "September";
		}
		else{
			return "";
		}
	}


	reservationReportResponse = reportFactory.ResReport(); 
	reservationReportResponse.$promise.then(function(data){
		$scope.resReport=data;
	});

	popCatReportResponse = reportFactory.PopularRoomCatReport(); 
	popCatReportResponse.$promise.then(function(data){
		$scope.popCatReport=data;
	});

	revenueReportResponse = reportFactory.RevenueReport(); 
	revenueReportResponse.$promise.then(function(data){
		$scope.revenueReport=data;
	});



})


.controller('paymentController', function($rootScope, $scope, paymentFactory){

	$("#expirationDatePicker").datetimepicker(
	{
		format: 'YYYY-MM-DD',
		minDate: new Date()
	});
	
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();
	$scope.creditCards = null; //the number for USING a card
	$scope.creditCardNumber; //the number for ADDING a card
	$scope.cardToDelete; //card you're trying to delete

	getCardsResponse = paymentFactory.GetCreditCards({
		"username": $rootScope.currentUser
	});
	getCardsResponse.$promise.then(function(data){
		$scope.creditCards = data; //data is an array
		if($scope.creditCards.length!=0){
			$scope.cardToDelete = $scope.creditCards[0].card_number;
		}
	});

	$scope.addCard = function(){
		$scope.expirationDate = $("#expirationDatePicker").data("date");
		addCreditCardResponse = paymentFactory.AddCreditCard({
			"username":$rootScope.currentUser,
			"card_number": $scope.creditCardNumber,
			"cvv": $scope.cvv,
			"expiration_date": $scope.expirationDate,
			"name": $scope.cardName //name of the owner of the card, not necesarilly the username
		});
		addCreditCardResponse.$promise.then(function(data){
			
			getCardsResponse = paymentFactory.GetCreditCards({
				"username": $rootScope.currentUser
			});

			getCardsResponse.$promise.then(function(cardData){
				$scope.creditCards = cardData; //data is an array
				window.alert("Card successfully added.");
			});
		});
	}

	
	$scope.deleteCard = function(){
		deleteCreditCardResponse = paymentFactory.DeleteCreditCard({
			"username": $rootScope.currentUser,
			"card_number": $scope.cardToDelete
		}, function(successData)
		{
			window.alert("Card successfully deleted.");
		},
		function(errorData)
		{
			window.alert(errorData.data['message']);
		});
	}


})

.controller('reviewController', function($rootScope, $scope, reviewFactory){
	$scope.loggedInBool = $rootScope.alreadyLoggedIn();
	$scope.comment = ''; //just in case the user doesn't give one, so in our'd DB, we won't have null, instead we'll have ''
	$scope.viewPart2= false;
	$scope.reviews;
	$scope.emptyTable = '';
	$scope.location="Atlanta";
	$scope.reviews = [];
	$scope.rating = "Neutral";
	$scope.hide = false;

	$scope.addReview = function(){
		addReviewResponse = reviewFactory.AddReview({
			"location": $scope.location, 
			"comment": $scope.comment,
			"rating": $scope.rating, 
			"username": $rootScope.currentUser
		});
	//handle promise
		addReviewResponse.$promise.then(function(data){
			window.alert("Review added!");
		});
	}

	$scope.getReviews = function(){
		getReviewsResponse = reviewFactory.GetReviews({
			"location": $scope.location
		});
		getReviewsResponse.$promise.then(function(data){
			$scope.viewPart2 = true;
			$scope.reviews = data; //this is an array
			if($scope.reviews.length==0 ){
				$scope.emptyTable="Sorry, there are no reviews for this location!";
				$scope.hide = true;
			}
			else{
				$scope.hide = false;
			}
		});
	}

})


.config(function($routeProvider) { //routing needs to be on a server in order to run
	$routeProvider
	.when('/',{
		templateUrl: 'static/views/welcome.html',
	})
	.when('/login', {
		templateUrl: 'static/views/login.html',
		controller: 'loginController'
	})
	.when('/register', {
		templateUrl: 'static/views/registerUser.html',
		controller: 'registerController'
	})
	.when('/portal', { //the page that the user can pick their task on
		templateUrl: 'static/views/selectionPage.html',
		controller: 'portalController'
	})
	.when('/searchroom', {
		templateUrl: 'static/views/searchRoom.html',
		controller: 'reservationController'
	})
	.when('/reserve', {
		templateUrl: 'static/views/searchRoom.html',
		controller: 'reservationController'
	})
	.when('/update', {
		templateUrl: 'static/views/updateReservation.html',
		controller: 'reservationController'
	})
	.when('/cancel', {
		templateUrl: 'static/views/cancelReservation.html',
		controller: 'reservationController'
	})
	.when('/payment', {
		templateUrl: 'static/views/payment.html',
		controller: 'paymentController'
	})
	.when('/resReport', {
		templateUrl: 'static/views/reservationReport.html',
		controller: 'reportController'
	})
	.when('/popCatReport', {
		templateUrl: 'static/views/popularRoomCatReport.html',
		controller: 'reportController'
	})
	.when('/revenueReport', {
		templateUrl: 'static/views/revenueReport.html',
		controller: 'reportController'
	})
	.when('/provideFeedback', {
		templateUrl: 'static/views/writeReview.html',
		controller: 'reviewController'
	})
	.when('/viewFeedback', {
		templateUrl: 'static/views/viewFeedback.html',
		controller: 'reviewController'
	});
})


