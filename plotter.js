function Plotter(canvas, cell_size_x, cell_size_y, x0, y0, scale, grid_color, axis_color) {
	this.width = canvas.width
	this.height = canvas.height
	this.ctx = canvas.getContext("2d")

	this.cell_size_x = cell_size_x
	this.cell_size_y = cell_size_y

	this.cells_x = this.width / (this.cell_size_x * 2)
	this.cells_y = this.height / (this.cell_size_y * 2)

	this.scale = scale
    this.scales = [ 2, 2, 2.5 ]
    this.scaleIndex = 0

	this.SetCenter(x0, y0)

	this.grid_color = grid_color
	this.axis_color = axis_color

	this.functions = []
    this.InitHandlers()
}

Plotter.prototype.InitHandlers = function() {
    let plotter = this

    document.addEventListener('mousewheel', function(e) {
        plotter.MouseWheel(e)
    })
}

// установка в центр картинки точки (x0, y0)
Plotter.prototype.SetCenter = function(x0, y0) {
	this.x0 = this.width / 2 - this.cell_size_x * x0
	this.y0 = this.height / 2 + this.cell_size_y * y0

	this.xmin = x0 - this.cells_x / this.scale
	this.xmax = x0 + this.cells_x / this.scale

	this.ymin = y0 - this.cells_y / this.scale
	this.ymax = y0 + this.cells_y / this.scale
}

// отрисовка линии
Plotter.prototype.DrawLine = function(x1, y1, x2, y2) {
	this.ctx.beginPath()
	this.ctx.moveTo(x1, y1)
	this.ctx.lineTo(x2, y2)
	this.ctx.stroke()
}

// отрисовка сетки
Plotter.prototype.DrawGrid = function() {
	this.ctx.strokeStyle = this.grid_color
	this.ctx.lineWidth = 1

	let top = Math.floor(this.y0 / this.cell_size_y)
	let bottom = Math.floor((this.height - this.y0) / this.cell_size_y)
	let right = Math.floor((this.width - this.x0) / this.cell_size_x) 
	let left = Math.floor(this.x0 / this.cell_size_x)

	for (let i = -bottom; i <= top; i++)
		this.DrawLine(0, this.y0 - i * this.cell_size_y, this.width, this.y0 - i * this.cell_size_y)

	for (let i = -left; i <= right; i++)
		this.DrawLine(this.x0 + i * this.cell_size_x, 0, this.x0 + i * this.cell_size_x, this.height)
}

// отрисовка засечек на оси ОУ
Plotter.prototype.DrawVerticalValues = function(x0, y0) {
	this.ctx.textBaseline = "middle"
	this.ctx.textAlign = x0 < this.width ? "left" : "right"
	
	let position = Math.min(Math.max(7, x0 + 7), this.width - 7)
	let top = Math.floor(this.y0 / this.cell_size_y)
	let bottom = Math.floor((this.height - this.y0) / this.cell_size_y)

	for (let i = -bottom; i <= top; i++) {
		if (i == 0)
			continue

		let y = this.y0 - i * this.cell_size_y
		let yv = Math.round(this.HtoY(y) * 1000000) / 1000000

		this.DrawLine(x0 - 4, y, x0 + 4, y)
		this.ctx.fillText(yv, position, y)
	}
}

// отрисовка засечек на оси ОХ
Plotter.prototype.DrawHorizontalValues = function(x0, y0) {
	this.ctx.textBaseline = y0 < this.height ? "top" : "bottom"
	this.ctx.textAlign = "center"
	
	let position = Math.min(Math.max(7, y0 + 7), this.height - 7)
	let right = Math.floor((this.width - this.x0) / this.cell_size_x) 
	let left = Math.floor(this.x0 / this.cell_size_x)

	for (let i = -left; i <= right; i++) {
		if (i == 0)
			continue
		
		let x = this.x0 + i * this.cell_size_x
		let xv = Math.round(this.WtoX(x) * 1000000) / 1000000

		this.DrawLine(x, y0 - 4, x, y0 + 4)
		this.ctx.fillText(xv, x, position)
	}
}

// отрисовка координатных осей
Plotter.prototype.DrawAxis = function() {
	let x0 = Math.min(Math.max(this.x0, 0), this.width)
	let y0 = Math.min(Math.max(this.y0, 0), this.height)

	this.ctx.strokeStyle = this.axis_color
	this.DrawLine(x0, 0, x0, this.height)
	this.DrawLine(0, y0, this.width, y0)

	this.ctx.fillStyle = this.axis_color
	this.ctx.font = "14px Calibri"

	this.DrawVerticalValues(x0, y0)
	this.DrawHorizontalValues(x0, y0)
}

// добавление функции для отрисовки
Plotter.prototype.AddFunction = function(f, color) {
	this.functions.push({ f: f, color: color })
}

// линейное преобразование числа x из [xmin, xmax] в [ymin, ymax]
Plotter.prototype.Map = function(x, xmin, xmax, ymin, ymax) {
	return (x - xmin) / (xmax - xmin) * (ymax - ymin) + ymin
}

// перевод x в пространство изображения
Plotter.prototype.XtoW = function(x) {
	return this.Map(x, this.xmin, this.xmax, 0, this.width)
}

// перевод y в пространство изображения
Plotter.prototype.YtoH = function(y) {
	return this.Map(y, this.ymin, this.ymax, this.height, 0)
}

// перевод w в пространство функции
Plotter.prototype.WtoX = function(w) {
	return this.Map(w, 0, this.width, this.xmin, this.xmax)
}

// перевод h в пространство функции
Plotter.prototype.HtoY = function(h) {
	return this.Map(h, this.height, 0, this.ymin, this.ymax)
}

// построение функции
Plotter.prototype.PlotFunction = function(func) {
	let step = (this.xmax - this.xmin) / this.width
	
	this.ctx.strokeStyle = func.color
	this.ctx.lineWidth = 2
	this.ctx.beginPath()
	this.ctx.moveTo(this.XtoW(this.xmin), this.YtoH(func.f(this.xmin)))

	for (let x = this.xmin; x <= this.xmax; x += step)
		this.ctx.lineTo(this.XtoW(x), this.YtoH(func.f(x)))

	this.ctx.stroke()
}

// отрисовка графиков
Plotter.prototype.Plot = function() {
	this.ctx.clearRect(0, 0, this.width, this.height)
	this.DrawGrid()
	this.DrawAxis()

	for (let i = 0; i < this.functions.length; i++)
		this.PlotFunction(this.functions[i])
}

// обработчик прокручивания колеса мыши
Plotter.prototype.MouseWheel = function(e) {
    let x0 = (this.width / 2 - this.x0) / this.cell_size_x
    let y0 = (this.y0 - this.height / 2) / this.cell_size_y
    let scale

    if (e.deltaY > 0) {
        this.scaleIndex = (this.scaleIndex + this.scales.length - 1) % this.scales.length
        scale = 1 / this.scales[this.scaleIndex]
    }
    else {
        scale = this.scales[this.scaleIndex]
        this.scaleIndex = (this.scaleIndex + 1) % this.scales.length
    }

    this.scale *= scale
    this.SetCenter(x0, y0)
    this.Plot()
}