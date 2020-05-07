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
	this.isPressed = false
    this.InitHandlers()
}

Plotter.prototype.InitHandlers = function() {
    let plotter = this

    document.addEventListener('mousewheel', function(e) {
        plotter.MouseWheel(e)
    })

    document.addEventListener('mousedown', function(e) {
        plotter.MouseDown(e)
    })

    document.addEventListener('mouseup', function(e) {
        plotter.MouseUp(e)
    })

    document.addEventListener('mousemove', function(e) {
        plotter.MouseMove(e)
    })
}

Plotter.prototype.Round = function(x) {
	return Math.round(x * 1000000) / 1000000
}

// установка в центр картинки точки (x0, y0)
Plotter.prototype.SetCenter = function(x0, y0) {
	this.x0 = this.width / 2 - this.cell_size_x * x0 * this.scale
	this.y0 = this.height / 2 + this.cell_size_y * y0 * this.scale

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
		let yv = this.Round(this.HtoY(y))

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
		let xv = this.Round(this.WtoX(x))

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

// отображение точек на функциях
Plotter.prototype.ShowValues = function(mx, my) {
	let x = this.WtoX(mx)
	let y = this.HtoY(my)

	this.ctx.textBaseline = 'bottom'

	for (let i = 0; i < this.functions.length; i++) {
		let f = this.functions[i].f(x)
		let fy = this.YtoH(f)

		this.ctx.beginPath()
		this.ctx.fillStyle = this.functions[i].color
		this.ctx.arc(mx, fy, 5, 0, Math.PI * 2)
		this.ctx.fill()
		this.ctx.fillText(this.Round(x) + ', ' + this.Round(f), mx, fy)
	}

	this.ctx.beginPath()
	this.ctx.fillStyle = this.axis_color
	this.ctx.arc(mx, my, 5, 0, Math.PI * 2)
	this.ctx.fill()
	this.ctx.fillText(this.Round(x) + ', ' + this.Round(y), mx, my)
}

// обработчик прокручивания колеса мыши
Plotter.prototype.MouseWheel = function(e) {
    let x0 = (this.width / 2 - this.x0) / this.cell_size_x / this.scale
    let y0 = (this.y0 - this.height / 2) / this.cell_size_y / this.scale

    let x = this.WtoX(e.offsetX)
    let y = this.HtoY(e.offsetY)

    let dx = x - x0
    let dy = y - y0

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
    this.SetCenter(x - dx / scale, y - dy / scale)
    this.Plot()
	this.ShowValues(e.offsetX, e.offsetY)
}

// обработчик нажатия кнопки мыши
Plotter.prototype.MouseDown = function(e) {
	if (e.target.tagName == "CANVAS") {
		this.isPressed = true
		this.prevX = e.offsetX
		this.prevY = e.offsetY
	}
}

// обработчик отжатия кнопки мыши
Plotter.prototype.MouseUp = function(e) {
	this.isPressed = false
}

// обработчик перемещения мыши
Plotter.prototype.MouseMove = function(e) {
	if (!this.isPressed) {
		this.Plot()
		this.ShowValues(e.offsetX, e.offsetY)
		return;
	}

	let dx = e.offsetX - this.prevX
	let dy = e.offsetY - this.prevY

	this.prevX = e.offsetX
	this.prevY = e.offsetY

	let x0 = (this.width / 2 - this.x0 - dx) / this.cell_size_x / this.scale
    let y0 = (this.y0 + dy - this.height / 2) / this.cell_size_y / this.scale

    this.SetCenter(x0, y0)
    this.Plot()
}