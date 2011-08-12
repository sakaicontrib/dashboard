/**********************************************************************************
 * $URL$
 * $Id$
 ***********************************************************************************
 *
 * Copyright (c) 2011 The Sakai Foundation
 *
 * Licensed under the Educational Community License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **********************************************************************************/

package org.sakaiproject.dash.logic;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Observable;
import java.util.Observer;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import net.sf.ehcache.Cache;

import org.apache.log4j.Logger;

import org.sakaiproject.authz.api.SecurityAdvisor;
import org.sakaiproject.authz.api.SecurityAdvisor.SecurityAdvice;
import org.sakaiproject.dash.dao.DashboardDao;
import org.sakaiproject.dash.listener.EventProcessor;
import org.sakaiproject.dash.model.CalendarItem;
import org.sakaiproject.dash.model.Context;
import org.sakaiproject.dash.model.NewsItem;
import org.sakaiproject.dash.model.NewsLink;
import org.sakaiproject.dash.model.Person;
import org.sakaiproject.dash.model.Realm;
import org.sakaiproject.dash.model.SourceType;
import org.sakaiproject.event.api.Event;
import org.sakaiproject.site.api.Site;
import org.sakaiproject.user.api.User;

/**
 * 
 *
 */
public class DashboardLogicImpl implements DashboardLogic, Observer 
{
	private static Logger logger = Logger.getLogger(DashboardLogicImpl.class);
	
	
	protected Map<String,EventProcessor> eventProcessors = new HashMap<String,EventProcessor>();
	
	protected DashboardEventProcessingThread eventProcessingThread = new DashboardEventProcessingThread();
	protected Queue<EventCopy> eventQueue = new ConcurrentLinkedQueue<EventCopy>();
		
	/************************************************************************
	 * Spring-injected classes
	 ************************************************************************/
	
	protected SakaiProxy sakaiProxy;
	public void setSakaiProxy(SakaiProxy proxy) {
		this.sakaiProxy = proxy;
	}
	
	protected DashboardDao dao;
	public void setDao(DashboardDao dao) {
		this.dao = dao;
	}
	
	protected Cache cache;
	public void setCache(Cache cache) {
		this.cache = cache;
	}
	
	/************************************************************************
	 * Dashboard Logic methods
	 ************************************************************************/
	
	/*
	 * (non-Javadoc)
	 * @see org.sakaiproject.dash.logic.DashboardLogic#createCalendarLinks(org.sakaiproject.dash.model.CalendarItem)
	 */
	public void createCalendarLinks(CalendarItem calendarItem) {
		if(logger.isDebugEnabled()) {
			logger.debug("createCalendarLinks(" + calendarItem + ")");
		}
		List<String> sakaiIds = this.sakaiProxy.getUsersWithReadAccess(calendarItem.getEntityReference(), calendarItem.getSourceType().getAccessPermission());
		for(String sakaiId : sakaiIds) {
			Person person = dao.getPersonBySakaiId(sakaiId);

	}
	
	}
	
	public NewsItem createNewsItem(String entityReference, Date newsTime,
			String context) {
		if(logger.isDebugEnabled()) {
			logger.debug("createNewsItem(" + entityReference + "," + newsTime + "," + context + ")");
		}
		// TODO Auto-generated method stub
		return null;
	}

	public void createNewsLinks(NewsItem newsItem) {
		if(logger.isDebugEnabled()) {
			logger.debug("createNewsLinks(" + newsItem + ")");
		}
		
		List<String> sakaiIds = this.sakaiProxy.getUsersWithReadAccess(newsItem.getEntityReference(), newsItem.getSourceType().getAccessPermission());
		if(sakaiIds != null && sakaiIds.size() > 0) {
			for(String sakaiId : sakaiIds) {
				
				Person person = dao.getPersonBySakaiId(sakaiId);
				if(person == null) {
					User userObj = this.sakaiProxy.getUser(sakaiId);
					person = new Person(sakaiId, userObj.getEid());
					dao.addPerson(person);
				}
				
				NewsLink link = new NewsLink(person, newsItem, newsItem.getContext(), false, false);
				
				dao.addNewsLink(link);
			}
		}
		
	}

	public CalendarItem createCalendarItem(String title, Date calendarTime,
			String entityReference, String entityUrl, Context context,
			SourceType sourceType) {
		
		CalendarItem calendarItem = new CalendarItem(title, calendarTime,
				entityReference, entityUrl, context, sourceType);
		
		dao.addCalendarItem(calendarItem);
		
		return calendarItem;
	}

	public NewsItem createNewsItem(String title, Date newsTime,
			String entityReference, String entityUrl, Context context,
			SourceType sourceType) {
		
		NewsItem newsItem = new NewsItem(title, newsTime, 
				entityReference, entityUrl, context, sourceType);
		
		dao.addNewsItem(newsItem);
		
		return dao.getNewsItem(entityReference) ;
	}

	public Context createContext(String contextId) {
		
		Site site = this.sakaiProxy.getSite(contextId);
		
		Context context = new Context(site.getId(), site.getTitle(), site.getUrl());
		dao.addContext(context);
		return dao.getContext(contextId);
	}

	public Realm createRealm(String entityReference, String contextId) {
		
		String realmId = null;
		Collection<String> groups = this.sakaiProxy.getRealmId(entityReference, contextId);
		if(groups != null && groups.size() > 0) {
			List<String> authzGroups = new ArrayList<String>(groups );
			if(authzGroups != null && authzGroups.size() > 0) {
				realmId = authzGroups.get(0);
			}
			if(realmId != null) {
				Realm realm = dao.getRealm(realmId);
				if(realm == null) {
					realm = new Realm(realmId);
					dao.addRealm(realm);
				}
				return realm;
			}
		}
		
		return null;
	}

	public SourceType createSourceType(String identifier, String accessPermission) {
		
		SourceType sourceType = new SourceType(identifier, accessPermission); 
		dao.addSourceType(sourceType);
		return dao.getSourceType(identifier);
	}
	
	public Context getContext(String contextId) {
		try {
			return dao.getContext(contextId);
			
		} catch(Exception e) {
			logger.debug("No context retrieved for contextId: " + contextId);
		}
		
		return null;
	}

	public Realm getRealm(String entityId) {
		// TODO: Should we be able to get the realm for an entityId or a contextId?  If so, do we need another table?
		//Realm realm = 
		return null;
	}

	public SourceType getSourceType(String identifier) {
		try {
			return dao.getSourceType(identifier);
		} catch(Exception e) {
			logger.debug("No context retrieved for identifier: " + identifier);
		}
		
		return null ;
	}

	public void registerEventProcessor(EventProcessor eventProcessor) {
		
		if(eventProcessor != null && eventProcessor.getEventIdentifer() != null) {
			this.eventProcessors.put(eventProcessor.getEventIdentifer(), eventProcessor);
		}
		
	}

	/************************************************************************
	 * init() and destroy()
	 ************************************************************************/

	public void init() {
		logger.info("init()");
		
		this.eventProcessingThread.start();
		
		this.sakaiProxy.addLocalEventListener(this);
	}
	
	public void destroy() {
		logger.info("destroy()");
		
		// need to shut down daemon once it's done processing events??
		//this.daemon.
	}

	/************************************************************************
	 * Observer method
	 ************************************************************************/

	/**
	 * 
	 */
	public void update(Observable arg0, Object obj) {
		if(obj instanceof Event) {
			Event event = (Event) obj;
			if(this.eventProcessors.containsKey(event.getEvent())) {
				if(logger.isDebugEnabled()) {
					logger.debug("adding event to queue: " + event.getEvent());
				}
				this.eventQueue.add(new EventCopy(event));				
			}
		}
		
	}

	/************************************************************************
	 * Making copies of events
	 ************************************************************************/

	/**
	 * 
	 */
	public class EventCopy implements Event 
	{

		protected String context;
		protected String eventIdentifier;
		protected Date eventTime;
		protected boolean modify;
		protected int priority;
		protected String entityReference;
		protected String sessionId;
		protected String userId;
		
		public EventCopy(Event original) {
			super();
			this.context = original.getContext();
			this.eventIdentifier = original.getEvent();
			this.eventTime = original.getEventTime();
			this.modify = original.getModify();
			this.priority = original.getPriority();
			this.entityReference = original.getResource();
			this.sessionId = original.getSessionId();
			this.userId = original.getUserId();
		}
		
		public String getContext() {
			return context;
		}

		public String getEvent() {
			return eventIdentifier;
		}

		public Date getEventTime() {
			return eventTime;
		}

		public boolean getModify() {
			return modify;
		}

		public int getPriority() {
			return priority;
		}

		public String getResource() {
			return entityReference;
		}

		public String getSessionId() {
			return sessionId;
		}

		public String getUserId() {
			return userId;
		}
		
	}
	
	/************************************************************************
	 * Event processing daemon (or thread?)
	 ************************************************************************/
	
	/**
	 * 
	 */
	public class DashboardEventProcessingThread extends Thread
	{
		private long sleepTime = 2L;

		public DashboardEventProcessingThread() {
			super("Dashboard Event Processing Thread");
			logger.info("Created Dashboard Event Processing Thread");
		}

		public void run() {
			logger.info("Started Dashboard Event Processing Thread");
			while(true) {
				if(logger.isDebugEnabled()) {
					logger.debug("Dashboard Event Processing Thread checking event queue: " + eventQueue.size());
				}
				if(eventQueue.isEmpty()) {
					try {
						Thread.sleep(sleepTime * 1000L);
					} catch (InterruptedException e) {
						
						e.printStackTrace();
					}
				} else {
					EventCopy event = eventQueue.poll();
					if(logger.isDebugEnabled()) {
						logger.debug("Dashboard Event Processing Thread is processing event: " + event.getEvent());
					}
					EventProcessor eventProcessor = eventProcessors.get(event.getEvent());
					
					SecurityAdvisor advisor = new DashboardLogicSecurityAdvisor(event.getResource());
					sakaiProxy.pushSecurityAdvisor(advisor );
					try {
						eventProcessor.processEvent(event);
					} catch (Exception e) {
						logger.warn("Error processing event: " + event, e);
					} finally {
						sakaiProxy.popSecurityAdvisor(advisor);
					}
				}
			}
		}
	}
	
	public class DashboardLogicSecurityAdvisor implements SecurityAdvisor 
	{
		protected String entityReference;
		
		/**
		 * @param entityReference
		 */
		public DashboardLogicSecurityAdvisor(String entityReference) {
			super();
			this.entityReference = entityReference;
		}

		/*
		 * (non-Javadoc)
		 * @see org.sakaiproject.authz.api.SecurityAdvisor#isAllowed(java.lang.String, java.lang.String, java.lang.String)
		 */
		public SecurityAdvice isAllowed(String userId, String function,
				String reference) {
			if(reference != null && reference.equalsIgnoreCase(entityReference)) {
				return SecurityAdvice.ALLOWED;
			}
			return SecurityAdvice.NOT_ALLOWED;
		}
		
	}

}
