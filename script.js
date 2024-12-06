'use strict';

class Workout {
  date = new Date(); // Set the workout date to the current date
  id = (Date.now() + '').slice(-10); // Generate a unique ID using the current timestamp
  clicks = 0; // Initialize the number of clicks

  constructor(coords, distance, duration) {
    this.coords = coords; // Store coordinates as [latitude, longitude]
    this.distance = distance; // Distance of the workout in kilometers
    this.duration = duration; // Duration of the workout in minutes
  }

  _setDescription() {
    // Define the months of the year for generating descriptions
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Create a description in the format "Type on Month Day"
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++; // Increment the click counter
  }
}

class Running extends Workout {
  type = 'running'; // Define the workout type as 'running'

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); // Call the parent constructor
    this.cadence = cadence; // Store the running cadence (steps per minute)
    this.calcPace(); // Calculate the running pace
    this._setDescription(); // Set the workout description
  }

  calcPace() {
    this.pace = this.duration / this.distance; // Calculate pace in minutes per kilometer
    return this.pace; // Return the calculated pace
  }
}

class Cycling extends Workout {
  type = 'cycling'; // Define the workout type as 'cycling'

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration); // Call the parent constructor
    this.elevationGain = elevationGain; // Store the elevation gain in meters
    this.calcSpeed(); // Calculate the cycling speed
    this._setDescription(); // Set the workout description
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // Calculate speed in kilometers per hour
    return this.speed; // Return the calculated speed
  }
}

// APPLICATION ARCHITECTURE
const form = document.querySelector('.form'); // Select the form element
const containerWorkouts = document.querySelector('.workouts'); // Select the workout container
const inputType = document.querySelector('.form__input--type'); // Select the input for workout type
const inputDistance = document.querySelector('.form__input--distance'); // Select the input for distance
const inputDuration = document.querySelector('.form__input--duration'); // Select the input for duration
const inputCadence = document.querySelector('.form__input--cadence'); // Select the input for cadence
const inputElevation = document.querySelector('.form__input--elevation'); // Select the input for elevation

class App {
  #map; // Private property for the map instance
  #mapZoomLevel = 13; // Default zoom level for the map
  #mapEvent; // Store the map event data
  #workouts = []; // Array to store all workouts

  constructor() {
    this._getPosition(); // Get the user's position

    this._getLocalStorage(); // Load workouts from local storage

    // Attach event handlers to the form and workout container
    form.addEventListener('submit', this._newWorkout.bind(this)); // Handle form submission
    inputType.addEventListener('change', this._toggleElevationField); // Toggle elevation/cadence fields
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); // Handle clicks to focus on a workout
    containerWorkouts.addEventListener(
      'click',
      this._handleWorkoutActions.bind(this) // Handle Edit and Delete actions
    );
  }

  _getPosition() {
    // Check if geolocation is supported
    if (navigator.geolocation)
      // Get the user's position
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // Load the map with the user's position
        function () {
          alert('Could not get your position'); // Alert the user if geolocation fails
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords; // Extract latitude from position
    const { longitude } = position.coords; // Extract longitude from position

    const coords = [latitude, longitude]; // Combine latitude and longitude into an array

    // Initialize the map with the user's position and zoom level
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // Add tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Add an event listener for map clicks to show the workout form
    this.#map.on('click', this._showForm.bind(this));

    // Render workout markers on the map for all stored workouts
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE; // Store the map event
    form.classList.remove('hidden'); // Show the form
    inputDistance.focus(); // Focus the distance input field
  }

  _hideForm() {
    // Clear all input fields in the form
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none'; // Temporarily hide the form
    form.classList.add('hidden'); // Add the 'hidden' class to the form
    setTimeout(() => (form.style.display = 'grid'), 1000); // Restore the grid layout after hiding
  }

  _toggleElevationField() {
    // Toggle the visibility of elevation and cadence input fields
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _handleWorkoutActions(e) {
    const target = e.target; // Get the clicked element

    if (target.classList.contains('btn--delete')) {
      // Check if the clicked button is for deletion
      const id = target.dataset.id; // Get the ID of the workout to delete
      this._deleteWorkout(id); // Call the delete method
    }

    if (target.classList.contains('btn--edit')) {
      // Check if the clicked button is for editing
      const id = target.dataset.id; // Get the ID of the workout to edit
      this._editWorkout(id); // Call the edit method
    }
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // Check if all inputs are finite numbers
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); // Check if all inputs are positive

    e.preventDefault(); // Prevent the default form submission behavior

    // Get data from the form
    const type = inputType.value; // Get the workout type (running or cycling)
    const distance = +inputDistance.value; // Get the distance as a number
    const duration = +inputDuration.value; // Get the duration as a number
    const { lat, lng } = this.#mapEvent.latlng; // Extract latitude and longitude from the map event
    let workout; // Variable to hold the workout object

    // If the workout is running, create a Running object
    if (type === 'running') {
      const cadence = +inputCadence.value; // Get the cadence as a number

      // Validate inputs and check positivity
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!'); // Show an alert if validation fails

      workout = new Running([lat, lng], distance, duration, cadence); // Create a new Running object
    }

    // If the workout is cycling, create a Cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value; // Get the elevation as a number

      // Validate inputs and check positivity
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!'); // Show an alert if validation fails

      workout = new Cycling([lat, lng], distance, duration, elevation); // Create a new Cycling object
    }

    // Add the new workout to the workouts array
    this.#workouts.push(workout);

    // Render the workout on the map as a marker
    this._renderWorkoutMarker(workout);

    // Render the workout in the sidebar list
    this._renderWorkout(workout);

    // Hide the form and clear input fields
    this._hideForm();

    // Save all workouts to local storage
    this._setLocalStorage();
  }

  _editWorkout(id) {
    // Find the workout to be edited by ID
    const workout = this.#workouts.find(workout => workout.id === id);

    // Pre-fill the form with existing workout details
    inputType.value = workout.type; // Set the workout type
    inputDistance.value = workout.distance; // Set the distance
    inputDuration.value = workout.duration; // Set the duration

    if (workout.type === 'running') {
      inputCadence.value = workout.cadence; // Set the cadence
      inputElevation.closest('.form__row').classList.add('form__row--hidden'); // Hide the elevation field
      inputCadence.closest('.form__row').classList.remove('form__row--hidden'); // Show the cadence field
    }

    if (workout.type === 'cycling') {
      inputElevation.value = workout.elevationGain; // Set the elevation gain
      inputCadence.closest('.form__row').classList.add('form__row--hidden'); // Hide the cadence field
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden'); // Show the elevation field
    }

    // Show the form for editing
    form.classList.remove('hidden');
    inputDistance.focus(); // Focus on the first input field

    // Remove the workout temporarily from the array
    this.#workouts = this.#workouts.filter(work => work.id !== id);

    // Attach a one-time event listener to save the edited workout
    form.addEventListener(
      'submit',
      function saveEdit(e) {
        e.preventDefault(); // Prevent default form submission

        // Get updated data from the form
        const type = inputType.value; // Get the updated workout type
        const distance = +inputDistance.value; // Get the updated distance
        const duration = +inputDuration.value; // Get the updated duration
        let updatedWorkout; // Variable for the updated workout

        // Handle the updated workout based on type
        if (type === 'running') {
          const cadence = +inputCadence.value; // Get the updated cadence

          // Validate inputs
          if (!distance || !duration || !cadence)
            return alert('Please provide valid inputs!'); // Show alert if validation fails

          // Create a new Running object with updated data
          updatedWorkout = new Running(
            workout.coords,
            distance,
            duration,
            cadence
          );
        }

        if (type === 'cycling') {
          const elevation = +inputElevation.value; // Get the updated elevation

          // Validate inputs
          if (!distance || !duration || !elevation)
            return alert('Please provide valid inputs!'); // Show alert if validation fails

          // Create a new Cycling object with updated data
          updatedWorkout = new Cycling(
            workout.coords,
            distance,
            duration,
            elevation
          );
        }

        // Add the updated workout back to the array
        this.#workouts.push(updatedWorkout);

        // Save all workouts to local storage and refresh the UI
        this._setLocalStorage();
        location.reload(); // Reload the page to reflect changes

        // Remove the event listener to prevent multiple triggers
        form.removeEventListener('submit', saveEdit);
      }.bind(this) // Bind 'this' to retain the class context
    );
  }

  _deleteWorkout(id) {
    // Find the index of the workout to be deleted
    const index = this.#workouts.findIndex(workout => workout.id === id);

    // Remove the workout from the workouts array
    this.#workouts.splice(index, 1);

    // Update the local storage and UI
    this._setLocalStorage();
    location.reload(); // Reload the page to update the list
  }

  _renderWorkoutMarker(workout) {
    // Create a marker on the map for the workout
    L.marker(workout.coords)
      .addTo(this.#map) // Add the marker to the map
      .bindPopup(
        // Bind a popup to the marker
        L.popup({
          maxWidth: 250, // Set maximum width of the popup
          minWidth: 100, // Set minimum width of the popup
          autoClose: false, // Prevent automatic closing
          closeOnClick: false, // Prevent closing on click
          className: `${workout.type}-popup`, // Use a class based on workout type
        })
      )
      .setPopupContent(
        // Set the content of the popup
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup(); // Open the popup automatically
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    html += `
      <div class="workout__actions">
        <button class="btn btn--edit" data-id="${workout.id}">Edit</button>
        <button class="btn btn--delete" data-id="${workout.id}">Delete</button>
      </div>
    </li>
    `;

    form.insertAdjacentHTML('afterend', html); // Insert the workout HTML after the form
  }

  _moveToPopup(e) {
    if (!this.#map) return; // Exit if the map is not initialized

    const workoutEl = e.target.closest('.workout'); // Find the closest workout element clicked

    if (!workoutEl) return; // Exit if no workout element was found

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id // Find the workout with the matching ID
    );

    this.#map.setView(workout.coords, 15, {
      animate: true, // Enable animation for the map movement
      pan: {
        duration: 2, // Set the duration of the animation to 2 seconds
      },
    });
  }

  _setLocalStorage() {
    // Save the current workouts array to local storage
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); // Retrieve workouts data from local storage

    if (!data) return; // Exit if no data was found in local storage

    this.#workouts = data; // Restore the workouts array with the retrieved data

    this.#workouts.forEach(work => {
      this._renderWorkout(work); // Render each workout in the sidebar
    });
  }

  reset() {
    localStorage.removeItem('workouts'); // Remove workouts data from local storage
    location.reload(); // Reload the page to reset the application state
  }
}
const app = new App(); // Create an instance of the App class to start the application
