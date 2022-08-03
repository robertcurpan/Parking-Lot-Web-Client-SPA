
var parkingLotStatus = {
    parkingSpots: null,
    tickets: null
};


function changeContent(resource) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("continut").innerHTML = this.responseText;
        }
  };

  xhttp.open("GET", resource + ".html", true);
  xhttp.send();
}


function doGenerateParkingTicket() {
    let name = document.getElementById("name").value;
    let vehicle = document.getElementById("vehicle").value;
    let color = document.getElementById("color").value;
    let price = document.getElementById("price").value;
    let electricString = document.getElementById("electric").value;
    let vipString = document.getElementById("vip").value;

    let electric = (electricString == "Yes") ? true : false;
    let vip = (vipString == "Yes") ? true : false;

    let requestBody = {
        type: vehicle,
        driver: {name: name, vipStatus: vip},
        color: color,
        price: price,
        electric: electric
    };

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            let ticket = JSON.parse(this.responseText);
            parkingLotStatus = updateParkingLotStatusWhenDriverParks(ticket);
            displayParkingLotStatusAsString();
        } else if (this.readyState == 4 && this.status == 409) {
            let errorMessage = JSON.parse(this.responseText).message;
            let errorDescription = createTextFromErrorMessage(errorMessage);
            document.getElementById("parkingLotStatusErrors").innerText = errorDescription;
        }
    };

    xhttp.open("POST", "http://localhost:8080/generateParkingTicket", true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(requestBody));
}


function doLeaveParkingLot() {
    let parkingSpotId = document.getElementById("parkingSpotId").value;
    let parkingSpot = null;
    for(let currentParkingSpot of parkingLotStatus.parkingSpots) {
        if(currentParkingSpot.id == parkingSpotId) {
            parkingSpot = currentParkingSpot;
            break;
        }
    }

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            let ticket = JSON.parse(this.responseText);
            parkingLotStatus = updateParkingLotStatusWhenDriverLeaves(ticket);
            displayParkingLotStatusAsString();
        } else if (this.readyState == 4 && this.status == 409) {
            let errorMessage = JSON.parse(this.responseText).message;
            let errorDescription = createTextFromErrorMessage(errorMessage);
            document.getElementById("parkingLotStatusErrors").innerText = errorDescription;
        }
    };

    if(parkingSpot != null) {
        xhttp.open("POST", "http://localhost:8080/leaveParkingLot", true);
        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.send(JSON.stringify(parkingSpot));
    } else {
        document.getElementById("parkingLotStatusErrors").innerText = "The parking spot with the given id does not exist!";
    }
    
}


function doGetParkingSpots() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            parkingLotStatus.parkingSpots = JSON.parse(this.responseText);
        }
    };

    xhttp.open("GET", "http://localhost:8080/getParkingSpots", true);
    xhttp.send();
}


function doGetTickets() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            parkingLotStatus.tickets = JSON.parse(this.responseText);
        }
    };

    xhttp.open("GET", "http://localhost:8080/getTickets", true);
    xhttp.send();
}


function arrayRemoveTicket(arr, ticket) {
    return arr.filter(function(currentTicket) {
        return currentTicket.parkingSpot.id != ticket.parkingSpot.id;
    });
}

function updateParkingLotStatusWhenDriverParks(ticket) {
    // Vom updata parkingLotStatus (Adaugam ticket-ul in lista de tickets si modificam vehicleId + version in parkingSpots)
    parkingLotStatus.tickets.push(ticket);
    updateParkingSpotInParkingLotStatus(ticket.parkingSpot);

    return parkingLotStatus;
}

function updateParkingLotStatusWhenDriverLeaves(ticket) {
    // Vom updata parkingLotStatus (Scoatem ticket-ul din lista de tickets si scoatem vehicleId din parkingSPot + updatam versiunea)
    parkingLotStatus.tickets = arrayRemoveTicket(parkingLotStatus.tickets, ticket);
    updateParkingSpotInParkingLotStatus(ticket.parkingSpot);
    return parkingLotStatus;
}

function updateParkingSpotInParkingLotStatus(parkingSpot) {
    for(let index = 0; index < parkingLotStatus.parkingSpots.length; ++index) {
        if(parkingLotStatus.parkingSpots[index].id == parkingSpot.id) {
            parkingLotStatus.parkingSpots[index] = parkingSpot;
            break;
        }
    }
}


function displayParkingLotStatusAsString() {
    let tickets = parkingLotStatus.tickets;
    let parkingSpots = parkingLotStatus.parkingSpots;
    let parkingSpotsAsString = "";
    let ticketsAsString = "";

    for(let parkingSpot of parkingSpots) {
        parkingSpotsAsString += getParkingSpotAsString(parkingSpot) + "\r\n";
    }


    for (let ticket of tickets) {
        ticketsAsString += getTicketAsString(ticket) + "\r\n";
    }
    
    document.getElementById("parkingLotStatusErrors").innerText = "";
    document.getElementById("parkingSpots").innerText = parkingSpotsAsString;
    document.getElementById("tickets").innerText = ticketsAsString;
}

function getParkingSpotAsString(parkingSpot) {
    let parkingSpotAsString = parkingSpot.id + " [" + parkingSpot.spotType + "] -> electric: " + parkingSpot.electric;
    return parkingSpotAsString;
}

function getTicketAsString(ticket) {
    let ticketAsString = "[" + ticket.vehicle.driver.name + ", VIP: " + ticket.vehicle.driver.vipStatus + "] - " + ticket.vehicle.vehicleType + " (" + ticket.vehicle.price + ") -> spot ID: " + ticket.parkingSpot.id;
    return ticketAsString;
}

function createTextFromErrorMessage(errorMessage) {
    var errorText = "";

    if (errorMessage === "unknown") {
        errorText = "Unknown error occured during operation!";
    } else if (errorMessage === "notFound") {
        errorText = "The parking spot with the given id does not exist!";
    } else if (errorMessage === "notAvailable") {
        errorText = "There is no free parking spot available for the current vehicle!";
    } else if (errorMessage === "optimisticLocking") {
        errorText = "Attempt to perform multiple operations at the same time. Try again!";
    } else if (errorMessage === "notOccupied") {
        errorText = "The parking spot with the given id is not occupied!";
    } else if (errorMessage === "tooExpensive") {
        errorText = "The vehicle's price must be at most 10.000!";
    }

    return errorText;
}

function loadHomePage() {
    changeContent('acasa'); 
    doGetParkingSpots(); 
    doGetTickets();
}