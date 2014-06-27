$rows = 5
$columns = 10

puts '<table id="digit-grid"><tbody>'
$rows.times do |i|
  puts ' <tr>'
  $columns.times do |j|
    k = i*$columns + j
    puts '  <td><img class="mnist-digit" data-index="' + k.to_s + '"></td>'
  end
  puts ' </tr>'
end
puts '</tbody></table>'
