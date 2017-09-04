/* timelineSmithAug27.js -- esp dates next to ranges */
'use strict'

function renderTimeline (tl, optionsObj) {
  // to the default values in options, add those in tl, then 2nd param;
  var options = {
    tabTitle: 'Default Tab Title',
    tlTitlePrefixHTML: '',
    tlTitleHTML: 'The Default Timeline Title',
    footerHTML: '',
    svgWidth: 1200,
    svgSideMargin: 25,
    topMarginHeight: 45,
    tlHeight: 300,
    timeAxisHeight: 40,
    svgHeight: null,
    topYLimit: 0.9,

    addEraLabels: true,
    eraTooltips: false,
    axisTicks: false,
    hasEraBeginEndPanels: false,
    topTimeAxis: false,
    datesNextToRanges: false,
    twoLines: []
  }
  // should be Object.assign();
  var prop
  for (prop in tl.options) { options[prop] = tl.options[prop] }
  delete tl.options
  for (prop in optionsObj) { options[prop] = optionsObj[prop] }
  // copy all options to tl;
  for (prop in options) { tl[prop] = options[prop] }
  options = undefined
  if (tl.topTimeAxis) { tl.topMarginHeight += 16 }
  tl.svgHeight = tl.topMarginHeight +
                 tl.tlHeight +
                 tl.timeAxisHeight

  var colorWheel = ['FFF7FB', 'ECE7F2', 'D0D1E6', 'A6BDDB',
    '74A9CF', '3690C0', '0570B0', '045A8D', '023858']

  if (tl.tabTitle) { d3.select('title').text(tl.tabTitle) }
  if (tl.tlTitlePrefixHTML) { d3.select('#tlTitlePrefix').html(tl.tlTitlePrefixHTML) }
  if (tl.tlTitleHTML) { d3.select('#tlTitle').html(tl.tlTitleHTML) }
  if (tl.footerHTML) { d3.select('#footer').html(tl.footerHTML).style('font-size', '1.5rem') }

  // need timescale in place for all placements!!
  // set up timescale for x-axis;
  var minDate = d3.min(tl.eraObjectsArr, function (d) { return parseInt(d.start) })
  var maxDate = d3.max(tl.eraObjectsArr, function (d) { return parseInt(d.stop) })
  if (tl.startDate) { minDate = tl.startDate }
  if (tl.stopDate) { maxDate = tl.stopDate }
  var timeScale = d3.scaleLinear()
                    .domain([minDate, maxDate])
                    .rangeRound([tl.svgSideMargin,
                      tl.svgWidth - tl.svgSideMargin])

  // assigned inside if statements;
  // var eraBeginEndPanel = undefined;
  // var eraTooltip       = undefined;
  // place an svg canvas inside the timeline div;
  var svg = d3.select('#timeline')
      // must be set programmatically!
      .style('width', tl.svgWidth + 'px')
    .append('svg')
      .attr('id', 'svg')
      .style('width', tl.svgWidth + 'px')
      .style('height', tl.svgHeight + 'px')
      .style('border', '2px solid crimson')
      .style('background-color', 'bisque')

  // add eras **as svg rects**;
  var erasGrp = svg.append('g')
      .attr('id', 'erasGrp')
      .selectAll('rect')
      .data(tl.eraObjectsArr)
      .enter()
      // one rect for each object in the array;
    .append('rect')
      // the id is the label, e.g., "UnitedKingdom" (alphanum only);
      .attr('id', function (d) { return d.label.replace(/\W/g, '') })
      .attr('x', function (d) { return timeScale(d.start) })
      .attr('y', function (d) { return tl.topMarginHeight + (d.topY * tl.tlHeight) })
      // slightly rounded corners;
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', function (d) {
        return timeScale(d.stop) -
                                         timeScale(d.start)
      })
      .attr('height', function (d) { return d.height * tl.tlHeight })
      .style('fill', function (d) { return d.bgcolor })
      .style('stroke-width', 1)
      .style('stroke', 'black')
      // show the two dates and the eraBeginEndPanel;
      .on('mouseover', function () {
        if (!showingDates && !showingAll) {
          // on mouseover of era, select the two start/stop dates whose class
          // is the era's id (the dates are text els) and make them visible;
          const classSelectorStr = '.eraDateGrp .' + d3.select(this).attr('id')
          d3.selectAll(classSelectorStr).classed('hidden', false)
        }
        const eraObj = this.__data__
        const startX = timeScale(eraObj.start)
        const topY = tl.topMarginHeight + (eraObj.topY * tl.tlHeight)
        if (!showingAll && tl.hasEraBeginEndPanels) {
          // get position and text for the eraBeginEndPanel;
          eraBeginEndPanel.style('max-width', '400px')
                          .style('left', (startX - 10) + 'px')
                          .style('top', (topY + 46) + 'px')
                          .html(tl.eraBeginEndPanelTextHash[eraObj.start] +
                                tl.eraBeginEndPanelTextHash[eraObj.stop])
                         .transition()
                          .duration(400)
                          .style('opacity', 0.95)
        }
        if (tl.hasDiscussion) {
          discPanel.html(tl.discussionTextsObj[eraObj.label])
                   .classed('hidden', false)
        }
        if (tl.eraTooltips) {
          eraTooltip.style('max-width', '400px')
                    .style('left', (startX - 10) + 'px')
                    .style('top', (topY + 46) + 'px')
                    .html(eraObj.text)
                   .transition()
                    .duration(400)
                    .style('opacity', 0.95)
        }
      })
      .on('mouseout', function () {
        if (!showingDates && !showingAll) {
          var classSelector = '.eraDateGrp .' + d3.select(this).attr('id')
          d3.selectAll(classSelector).classed('hidden', true)
        }
        if (tl.hasEraBeginEndPanels) {
          eraBeginEndPanel.transition()
                   .duration(400)
                   .style('opacity', 1e-6)
        }
        if (tl.hasDiscussion) {
          discPanel.classed('hidden', true)
        }
      }) // end of ers generation;

  // =============== OPTIONAL HTML ELEMENTS ==============
  if (tl.hasEraBeginEndPanels) {
    // eraBeginEndPanel is a one-HTML-element **d3 selection**; initially transparent;
    // we manipulate it via callbacks using d3 methods;
    var eraBeginEndPanel = d3.select('#timeline')
      .append('div')
        .attr('id', 'eraBeginEndPanel')
        .style('opacity', 1e-6)
        // see additional CSS!!
  }
  if (tl.eraTooltips) {
    // eraBeginEndPanel is a one-HTML-element **d3 selection**; initially transparent;
    // we manipulate it via callbacks using d3 methods;
    var eraTooltip = d3.select('#timeline')
      .append('div')
        .attr('id', 'eraTooltip')
        .style({ 'position': 'absolute',
          'z-index': 2,
          'opacity': 1e-6 })
  }

  // ============== ERA LABELS (as HTML) ====================
  if (tl.addEraLabels) {
    // eraLabels as **HTML divs** to take advantage of text wrapping;
    // if widest word is wider than the era itself, then it overflows;
    // in such a case, we want to make the <div> wide enough and place
    // in evenly straddling the era.
    var eraLabelsFontSize = '16px'
    var widthSpan = d3.select('body')
        .append('span')
        .attr('id', 'overflowSpan')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
    var getLeftAndStoreWidthVoffset = function (d) {
      // handle missing ioffset property;
      d.voffset = d.voffset ? d.voffset : 0
      // does widest word overflow? Sort by length descending;
      var words = d.label.split(/ /)
      var longestWord =
              words.sort(function (a, b) { return b.length - a.length })[0]
      // console.log("Longest: " + longestWord);
      widthSpan.text(longestWord)
      var longestWordWidth =
                        document.getElementById('overflowSpan').clientWidth
      // console.log("Width of " + longestWord + ": " + longestWordWidth);
      var widthOfEra = timeScale(d.stop) - timeScale(d.start)
      // console.log("Width of " + d.label + ": " + widthOfEra);
      if (widthOfEra > longestWordWidth) {
        d.width = widthOfEra
        return timeScale(d.start) + 'px'
      } else {
        // left offset is half of excess width + 2;
        var offsetLeft = timeScale(d.start) -
                         ((longestWordWidth - widthOfEra + 2) / 2)
        // console.log("Offset left: " + offsetLeft);
        d.width = longestWordWidth + 2
        return offsetLeft + 'px'
      }
    }
    var eraLabelsGrp = d3.select('#timeline')
        .append('g')
        .attr('id', 'eraLabelsGrp')
        .selectAll('div')
        .data(tl.eraObjectsArr)
        .enter()
        // one div for each object in the array;
      .append('div')
        .attr('class', 'eraLabel')
        .attr('id', function (d) {
          return d.label.replace(/\W/g, '') + 'Label'
        })
        // position against top-left corner of era with same width;
        .style('position', 'absolute')
        // need two versions: this if it fits; wider if not;
        .style('left', function (d) { return getLeftAndStoreWidthVoffset(d) })
        .style('top', function (d) {
          return (tl.topMarginHeight + (d.topY * tl.tlHeight)) + 10 +
                                  d.voffset + 'px'
        })
        .style('width', function (d) { return d.width + 'px' })
        .text(function (d) { return d.label })
  }

  // each era gets TWO svg text elements; class == class-of-era;
  var eraDateFontSize = '16px'
  function addEraDates (startOrStop) {
    const start = startOrStop == 'start'
    const datesAtTop = !tl.datesNextToRanges
    const yForDatesAtTop = tl.topMarginHeight - (0.5 * parseInt(eraDateFontSize))
    function getDateX (start, d) {
      // middle of text element is at startDate or stopDate;
      let x = timeScale(start ? d.start : d.stop)
      if (tl.datesNextToRanges) {
        // left or right of range; text-anchor will be end or start;
        start ? x -= 8 : x += 8
      }
      return x
    }
    svg.append('g')
        .attr('id', start ? 'eraStartDateGrp' : 'eraStopDateGrp')
        .attr('class', 'eraDateGrp')
        .selectAll('text')
        .data(tl.eraObjectsArr)
        .enter()
      .append('text')
        .attr('class', function (d) { return d.label.replace(/\W/g, '') })
        // ToDo: use d3 transition to show/hide;
        .classed('hidden', true)
        .attr('text-anchor', datesAtTop ? 'middle' : (start ? 'end' : 'start'))
        .attr('x', function (d) { return getDateX(start, d) })
        .attr('y', (datesAtTop ? yForDatesAtTop
             : function (d) { return tl.topMarginHeight + (d.topY * tl.tlHeight) + 20 }))
        .text(function (d) { return start ? d.start : d.stop })
        .attr('font-family', 'sans-serif')
        .attr('font-size', eraDateFontSize)
        // .attr("font-weight", "bold")
        .attr('fill', 'black')
        .attr('text-rendering', 'optimizeLegibility')
  }
  addEraDates('start')
  addEraDates('stop')

  // ============== hasEvents ===============================================
  if (tl.hasEvents) {
    var events = svg.append('g')
        .attr('id', 'eventsGrp')
        .selectAll('circle')
        .data(tl.eventsArr)
        .enter()
      .append('circle')
        .style('fill', '#666')
        .attr('id', function (d) { return d.label })
        .attr('cx', function (d) { return timeScale(d.date) })
        .attr('cy', function (d) {
          return (d.centerY * tl.tlHeight) + tl.topMarginHeight
        })
        .attr('r', 6)
        .on('mouseover', function () {
          // display the eraBeginEndPanel under the circle;
          // get position and text for the eraBeginEndPanel;
          var thisData = this.__data__
          var leftX = timeScale(thisData.date) - 30
          var topY = tl.topMarginHeight + (thisData.centerY * tl.tlHeight) + 16
          var panelText = thisData.label
          eraBeginEndPanel.style('max-width', '200px')
                   .style('left', leftX + 'px')
                   .style('top', topY + 'px')
                   .html(panelText)
                  .transition()
                   .duration(500)
                   .style('opacity', 0.95)
        })
        .on('mouseout', function () {
          eraBeginEndPanel.transition()
                   .duration(500)
                   .style('opacity', 1e-6)
        })
  }

  // ============== hasPeople ===============================================
  if (tl.hasPeople) {
    // var lineX1 = null;
    var lineX2 = null
    var lineCenterX = null
    var lineY = null
    var lineLabel = null
    var computeValues = function (d) {
      // linecap: round adds 2px to each end of line;
      d.lineX1 = timeScale(d.born) + 2
      lineX2 = timeScale(d.died) - 2
      lineCenterX = (lineX1 + lineX2) / 2
      lineY = tl.topMarginHeight + (d.y * tl.tlHeight)
      lineLabel = d.name
      console.log(d.lineX1 + ' ' + lineX2 + ' ' + lineCenterX + ' ' +
                  lineY + ' ' + lineLabel)
    }
    var events = svg.append('g')
        .attr('id', 'peopleGrp')
        .selectAll('line')
        .data(tl.peopleArr)
        .enter()
      .append('line')
        .attr('id', function (d) { return d.name.replace(/\W/g, '') })
        .attr('x1', function (d) { return timeScale(d.born) + 2 })
        .attr('x2', function (d) { return timeScale(d.died) - 2 })
        .attr('y1', function (d) { return tl.topMarginHeight + (d.y * tl.tlHeight) })
        .attr('y2', function (d) { return tl.topMarginHeight + (d.y * tl.tlHeight) })
        .attr('stroke-width', 3)
        .attr('stroke', function (d) { return d.lineColor })
        .attr('stroke-linecap', 'round')

    var events = svg.append('g')
        .attr('id', 'peopleLabelsGrp')
        .selectAll('text')
        .data(tl.peopleArr)
        .enter()
      .append('text')
        .attr('id', function (d) { return d.name.replace(/\W/g, '') + '-label' })
        .attr('x', function (d) {
          return ((timeScale(d.born) + 2) +
                                        (timeScale(d.died) - 2)) / 2
        })
        .attr('y', function (d) { return tl.topMarginHeight + (d.y * tl.tlHeight) - 4 })
        .text(function (d) { return d.name })
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('fill', function (d) { return d.labelColor })
  }

  // ============== hasEmblems ===============================================
  if (tl.hasEmblems) {
    var emblems = svg.append('g')
        .attr('id', 'emblemsGrp')
        .selectAll('ellipse')
        .data(tl.emblemArr)
        .enter()
      .append('ellipse')
        .attr('id', function (d) { return d.name.replace(/\W/g, '') + '-emblem' })
        .attr('cx', function (d) { return timeScale(d.year) })
        .attr('cy', function (d) { return tl.topMarginHeight + (d.y * tl.tlHeight) })
        .attr('rx', 10)
        .attr('ry', 13)
        .attr('fill', '#EEEEEE')
        .attr('stroke-width', 2)
        .attr('stroke', 'black')

    emblems.select('#emblemsGrp')
        .data(tl.emblemArr)
        .enter()
      .append('text')
        .attr('id', function (d) { return d.name.replace(/\W/g, '') + '-label' })
        .attr('x', function (d) { return timeScale(d.year) })
        .attr('y', function (d) { return tl.topMarginHeight + (d.y * tl.tlHeight) + 4 })
        .text(function (d) { return d.name })
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
  }

  // ============== showDatesCB ==============================
  var showingDates = false
  if (tl.showDatesCB) {
    d3.select('#showDatesCB').on('change', function (event) {
      if (this.checked) {
        d3.selectAll('.eraDateGrp text').classed('hidden', false)
        showingDates = true
      } else {
        d3.selectAll('.eraDateGrp text').classed('hidden', true)
        showingDates = false
      }
    })
  }
  // ============== showAllCB =================
  var showingAll = false
  if (tl.hasEraBeginEndPanels && tl.showAllCB) {
    var infoHTML = ''
    var orderedKeys =
      Object.keys(eraBeginEndPanelTextHash).sort(function (a, b) { return a - b })
    orderedKeys.forEach(function (key) {
      infoHTML += eraBeginEndPanelTextHash[key]
    })
    // d3.select("body").append("div")
    d3.select('body').insert('div', '#indexLink')
      .attr('id', 'infoDisplay')
      .attr('class', 'hidden')
      .html(infoHTML)
    d3.select('#showAllCB').on('change', function (event) {
      if (this.checked) {
        d3.selectAll('.eraDateGrp text').classed('hidden', false)
        d3.select('#infoDisplay').classed('hidden', false)
        showingAll = true
      } else {
        d3.selectAll('.eraDateGrp text').classed('hidden', true)
        d3.select('#infoDisplay').classed('hidden', true)
        // d3.select("#showDatesCB").attr("checked", false);
        d3.select('#showDatesCB')[0][0].checked = false
        showingAll = false
      }
    })
  }
  // ============== hideLabelsCB ==============================
  var hidingLabels = false
  if (tl.hideLabelsCB) {
    d3.select('#hideLabelsCB').on('change', function (event) {
      if (this.checked) {
        d3.selectAll('.eraLabel').classed('hidden', true)
        showingDates = true
      } else {
        d3.selectAll('.eraLabel').classed('hidden', false)
        showingDates = false
      }
    })
  }
  // ============== hasDiscussion =================
  if (tl.hasDiscussion) {
    var discPanel = d3.select('body').insert('div', '#indexLink')
      .attr('id', 'discPanel')
      .attr('class', 'hidden')
  }

  // ============== AXIS/AXES ===========================================
  // timeAxis is a function which returns the SVG elements for the axis;
  let nocommaFormat = d3.format('')
  let timeAxis = d3.axisBottom(timeScale)
                   .tickFormat(function (d) { return nocommaFormat(d) })
  if (tl.axisTicks) { timeAxis.ticks(tl.axisTicks) }

  svg.append('g')
      .attr('id', 'timeAxisGrp')
      // default position is at top of SVG; move to bottom;
      .attr('transform',
            'translate(0, ' + (tl.topMarginHeight + tl.tlHeight + 1) + ')')
      // see relevant CSS styling line, path, and text;
      .call(timeAxis)

  if (tl.topTimeAxis) {
    let topTimeAxis = d3.axisTop(timeScale)
                        .tickFormat(function (d) { return nocommaFormat(d) })
    if (tl.axisTicks) { topTimeAxis.ticks(tl.axisTicks) }

    svg.append('g')
        .attr('id', 'topTimeAxisGrp')
        // default position is at top of SVG; move to bottom;
        .attr('transform',
              'translate(0, 30)')
              // "translate(0, " + (topMarginHeight + tlHeight + 15) + ")")
        // see relevant CSS styling line, path, and text;
        .call(topTimeAxis)
  }
/*
          d3format.locale = {
            "decimal": ".",
            "thousands": ",",
            "grouping": [3],
            "currency": ["$", ""]
          }
*/
};
