<h1 align="center">🚀 CrewGeeks — Sistema de Gestión de Empleados</h1>

<p align="center">
  <i>"Te ayudamos con tu espacio de trabajo"</i>
</p>

<hr/>

<h2>✨ Idea general</h2>
<p>
Plataforma ligera para gestionar <b>personal, turnos, nómina, vacaciones y sugerencias</b> dentro de una o varias compañías. 
El enfoque es práctico: CRUDs claros, base de datos relacional desde el día uno y una interfaz limpia que pueda crecer.
</p>

<h2>📝 Cómo lo planeamos</h2>
<ul>
  <li>Bocetamos el flujo en <b>Excalidraw</b> para alinear pantallas clave.</li>
  <li>Definimos navegación, campos mínimos y estados básicos.</li>
  <li>Modelamos la base de datos con un <b>diagrama ERD</b>.</li>
</ul>


<h2>🗄️ Diseño de datos</h2>
<p>
Arrancamos con SQLAlchemy para asegurar consistencia desde el backend. Entidades: 
<code>Company</code>, <code>Employee</code>, <code>Role</code>, <code>Salary</code>, <code>Payroll</code>, 
<code>Shifts</code>, <code>Holidays</code>, <code>Suggestions</code>.
</p>



<h2>⚙️ Stack</h2>
<ul>
  <li><b>Backend:</b> Flask + SQLAlchemy, CORS habilitado.</li>
  <li><b>Frontend:</b> React con un Navbar base y estilos iniciales.</li>
</ul>

<h2>🚦 Cómo ejecutar (rápido)</h2>
<pre>
</pre>

<h2>📌 Rutas principales</h2>
<ul>
  <li><code>/companies</code>, <code>/employees</code>, <code>/roles</code>, <code>/salaries</code>, <code>/payroll</code>, <code>/shifts</code>, <code>/holidays</code>, <code>/suggestions</code></li>
</ul>

<hr/>

<p align="center">💜 CrewGeeks — “Te ayudamos con tu espacio de trabajo”</p>



This template was built as part of the 4Geeks Academy [Coding Bootcamp](https://4geeksacademy.com/us/coding-bootcamp) by [Alejandro Sanchez](https://twitter.com/alesanchezr) and many other contributors. Find out more about our [Full Stack Developer Course](https://4geeksacademy.com/us/coding-bootcamps/part-time-full-stack-developer), and [Data Science Bootcamp](https://4geeksacademy.com/us/coding-bootcamps/datascience-machine-learning).

You can find other templates and resources like this at the [school github page](https://github.com/4geeksacademy/).
